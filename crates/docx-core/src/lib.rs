//! LocalDocx Core - Rust Engine for DOCX manipulation
//! Conçu pour fonctionner 100% en local sans dépendance externe.

use docx_rs::*;
use std::fs::File;
use std::io::{Read, Write};
use std::path::Path;

#[derive(Debug)]
pub enum LocalDocxError {
    Io(std::io::Error),
    Docx(DocxError),
    InvalidFormat(String),
}

impl From<std::io::Error> for LocalDocxError {
    fn from(err: std::io::Error) -> Self {
        LocalDocxError::Io(err)
    }
}

impl From<DocxError> for LocalDocxError {
    fn from(err: DocxError) -> Self {
        LocalDocxError::Docx(err)
    }
}

/// Crée un nouveau document DOCX avec titre et texte de base
pub fn create_document(title: &str, content_paragraphs: &[&str], output_path: &Path) -> Result<(), LocalDocxError> {
    let file = File::create(output_path)?;
    let mut doc = Docx::new();

    // Titre principal
    doc = doc.add_paragraph(
        Paragraph::new()
            .add_run(Run::new().add_text(title).size(44).bold())
            .align(AlignmentType::Center),
    );

    // Paragraphes de contenu
    for &p in content_paragraphs {
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text(p).size(24))
                .align(AlignmentType::Left),
        );
    }

    doc.build().pack(file)?;
    Ok(())
}

/// Lit les métadonnées de base d'un document DOCX (archive zip)
pub fn inspect_docx_archive(docx_path: &Path) -> Result<Vec<String>, LocalDocxError> {
    let file = File::open(docx_path)?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| LocalDocxError::InvalidFormat(e.to_string()))?;

    let mut entries = Vec::new();
    for i in 0..archive.len() {
        if let Ok(f) = archive.by_index(i) {
            entries.push(f.name().to_string());
        }
    }
    Ok(entries)
}
