use nexora_core::{NexoraError, Result};
use sha2::{Digest, Sha256};
use subtle::ConstantTimeEq;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Role {
    Admin,
    ReadWrite,
    ReadOnly,
}

#[derive(Debug, Clone)]
pub struct AuthManager {
    master_key_hash: Option<Vec<u8>>,
}

impl AuthManager {
    pub fn new(configured_key: Option<&str>) -> Self {
        let master_key_hash = configured_key.map(|k| {
            let mut hasher = Sha256::new();
            hasher.update(k.as_bytes());
            hasher.finalize().to_vec()
        });
        Self { master_key_hash }
    }

    pub fn is_auth_required(&self) -> bool {
        self.master_key_hash.is_some()
    }

    pub fn verify_key(&self, candidate: &str) -> Result<Role> {
        match &self.master_key_hash {
            None => Ok(Role::Admin), // Open auth in development mode
            Some(expected_hash) => {
                let mut hasher = Sha256::new();
                hasher.update(candidate.as_bytes());
                let candidate_hash = hasher.finalize();

                if candidate_hash.as_slice().ct_eq(expected_hash.as_slice()).into() {
                    Ok(Role::Admin)
                } else {
                    Err(NexoraError::Unauthorized("Invalid API key".into()))
                }
            }
        }
    }
}
