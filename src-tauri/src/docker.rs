use hyper::{body::HttpBody, Body, Request};
use hyperlocal::{UnixClientExt, Uri as UnixUri};
use serde::{Deserialize, Serialize};
use std::path::Path;

// ── Types returned to the frontend ─────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerImage {
    pub id: String,
    /// Short form: first 12 chars of the full sha
    pub short_id: String,
    /// Repository tags, e.g. ["nginx:latest"]. Empty for dangling images.
    pub tags: Vec<String>,
    /// Size in bytes
    pub size: u64,
    /// Created timestamp (Unix seconds)
    pub created: i64,
    /// "dangling" | "untagged" | "unused"
    pub reason: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StorageStats {
    pub total_bytes: u64,
    pub unused_bytes: u64,
    pub image_count: usize,
}

// ── Raw Docker API types ────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
struct RawImage {
    #[serde(rename = "Id")]
    id: String,
    #[serde(rename = "RepoTags")]
    repo_tags: Option<Vec<String>>,
    #[serde(rename = "Size")]
    size: u64,
    #[serde(rename = "Created")]
    created: i64,
}

// ── Socket path detection ───────────────────────────────────────────────────

pub fn socket_path() -> Option<String> {
    if Path::new("/var/run/docker.sock").exists() {
        return Some("/var/run/docker.sock".into());
    }
    if let Ok(home) = std::env::var("HOME") {
        let p = format!("{home}/.docker/run/docker.sock");
        if Path::new(&p).exists() {
            return Some(p);
        }
    }
    None
}

// ── HTTP helpers ────────────────────────────────────────────────────────────

async fn read_body(body: &mut Body) -> Result<Vec<u8>, String> {
    let mut buf = Vec::new();
    while let Some(chunk) = body.data().await {
        let chunk = chunk.map_err(|e| format!("Body error: {e}"))?;
        buf.extend_from_slice(&chunk);
    }
    Ok(buf)
}

async fn docker_request(socket: &str, method: &str, path: &str) -> Result<String, String> {
    let url = UnixUri::new(socket, path);

    let client = hyper::Client::unix();

    let req = Request::builder()
        .method(method)
        .uri(url)
        .header("Host", "localhost")
        .body(Body::empty())
        .map_err(|e| format!("Request build error: {e}"))?;

    let res = client
        .request(req)
        .await
        .map_err(|e| format!("Request error: {e}"))?;

    let mut body = res.into_body();
    let bytes = read_body(&mut body).await?;

    String::from_utf8(bytes).map_err(|e| format!("UTF-8 error: {e}"))
}

async fn docker_get(socket: &str, path: &str) -> Result<String, String> {
    docker_request(socket, "GET", path).await
}

async fn docker_delete(socket: &str, path: &str) -> Result<String, String> {
    docker_request(socket, "DELETE", path).await
}

// ── Public API ──────────────────────────────────────────────────────────────

pub async fn list_unused_images() -> Result<Vec<DockerImage>, String> {
    let socket = socket_path().ok_or("Docker socket not found. Is Docker running?")?;

    let raw = docker_get(&socket, "/images/json?all=false").await?;
    let images: Vec<RawImage> =
        serde_json::from_str(&raw).map_err(|e| format!("Parse error: {e}"))?;

    let mut result = Vec::new();
    for img in images {
        let tags = img
            .repo_tags
            .unwrap_or_default()
            .into_iter()
            .filter(|t| t != "<none>:<none>")
            .collect::<Vec<_>>();

        if tags.is_empty() {
            let short_id = img.id.replace("sha256:", "")[..12].to_string();
            result.push(DockerImage {
                id: img.id,
                short_id,
                tags: vec![],
                size: img.size,
                created: img.created,
                reason: "dangling".into(),
            });
        }
    }

    Ok(result)
}

pub async fn remove_image(image_id: &str) -> Result<(), String> {
    let socket = socket_path().ok_or("Docker socket not found.")?;
    let path = format!("/images/{image_id}?force=false&noprune=false");
    docker_delete(&socket, &path).await?;
    Ok(())
}

pub async fn remove_all_unused() -> Result<usize, String> {
    let images = list_unused_images().await?;
    let count = images.len();
    for img in &images {
        if let Err(e) = remove_image(&img.id).await {
            eprintln!("Failed to remove {}: {e}", img.short_id);
        }
    }
    Ok(count)
}

pub async fn get_storage_stats() -> Result<StorageStats, String> {
    let images = list_unused_images().await?;
    let unused_bytes: u64 = images.iter().map(|i| i.size).sum();
    Ok(StorageStats {
        total_bytes: unused_bytes,
        unused_bytes,
        image_count: images.len(),
    })
}
