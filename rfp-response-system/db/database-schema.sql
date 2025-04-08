-- Database schema for storing Advanced Content Analysis results

-- Document table to store basic document information
CREATE TABLE documents (
    document_id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    format VARCHAR(50),
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    processing_status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT
);

-- Language information table
CREATE TABLE document_languages (
    language_id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(document_id) ON DELETE CASCADE,
    primary_language VARCHAR(50) NOT NULL,
    confidence FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    has_encoding_issues BOOLEAN DEFAULT FALSE,
    is_multilingual BOOLEAN DEFAULT FALSE
);

-- Language details for specific sections
CREATE TABLE section_languages (
    section_language_id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(document_id) ON DELETE CASCADE,
    section_key VARCHAR(100) NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    confidence FLOAT,
    section_start_index INTEGER,
    section_length INTEGER
);

-- Document encoding issues
CREATE TABLE encoding_issues (
    issue_id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(document_id) ON DELETE CASCADE,
    issue_description TEXT NOT NULL,
    issue_location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document structure table
CREATE TABLE document_structures (
    structure_id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(document_id) ON DELETE CASCADE,
    title VARCHAR(255),
    section_count INTEGER,
    max_depth INTEGER,
    toc_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document sections table
CREATE TABLE document_sections (
    section_id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(document_id) ON DELETE CASCADE,
    structure_id INTEGER REFERENCES document_structures(structure_id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES document_sections(section_id),
    title TEXT NOT NULL,
    content TEXT,
    level INTEGER NOT NULL,
    section_number VARCHAR(50),
    start_index INTEGER,
    end_index INTEGER,
    page_number INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table information
CREATE TABLE document_tables (
    table_id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(document_id) ON DELETE CASCADE,
    section_id INTEGER REFERENCES document_sections(section_id),
    table_number INTEGER,
    row_count INTEGER,
    column_count INTEGER,
    has_headers BOOLEAN DEFAULT TRUE,
    page_number INTEGER,
    caption TEXT,
    context TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table data (rows and cells)
CREATE TABLE table_rows (
    row_id SERIAL PRIMARY KEY,
    table_id INTEGER REFERENCES document_tables(table_id) ON DELETE CASCADE,
    row_index INTEGER NOT NULL,
    is_header BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE table_cells (
    cell_id SERIAL PRIMARY KEY,
    row_id INTEGER REFERENCES table_rows(row_id) ON DELETE CASCADE,
    column_index INTEGER NOT NULL,
    content TEXT,
    data_type VARCHAR(20), -- 'text', 'number', 'date', etc.
    span_rows INTEGER DEFAULT 1,
    span_cols INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analysis metadata and configuration
CREATE TABLE analysis_configs (
    config_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    config_json JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_analysis_runs (
    run_id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(document_id) ON DELETE CASCADE,
    config_id INTEGER REFERENCES analysis_configs(config_id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'running',
    error_message TEXT,
    results_summary JSONB
);

-- Indexes for performance
CREATE INDEX idx_documents_filename ON documents(filename);
CREATE INDEX idx_document_languages_document_id ON document_languages(document_id);
CREATE INDEX idx_section_languages_document_id ON section_languages(document_id);
CREATE INDEX idx_document_sections_document_id ON document_sections(document_id);
CREATE INDEX idx_document_sections_parent_id ON document_sections(parent_id);
CREATE INDEX idx_document_tables_document_id ON document_tables(document_id);
CREATE INDEX idx_table_rows_table_id ON table_rows(table_id);
CREATE INDEX idx_table_cells_row_id ON table_cells(row_id);
CREATE INDEX idx_document_analysis_runs_document_id ON document_analysis_runs(document_id);

-- View for document summaries
CREATE VIEW document_analysis_summary AS
SELECT 
    d.document_id,
    d.filename,
    d.title,
    d.format,
    dl.primary_language,
    dl.confidence AS language_confidence,
    dl.is_multilingual,
    ds.section_count,
    ds.max_depth,
    COUNT(DISTINCT dt.table_id) AS table_count,
    dar.completed_at,
    dar.status AS analysis_status
FROM 
    documents d
LEFT JOIN document_languages dl ON d.document_id = dl.document_id
LEFT JOIN document_structures ds ON d.document_id = ds.document_id
LEFT JOIN document_tables dt ON d.document_id = dt.document_id
LEFT JOIN document_analysis_runs dar ON d.document_id = dar.document_id
GROUP BY 
    d.document_id, d.filename, d.title, d.format, 
    dl.primary_language, dl.confidence, dl.is_multilingual,
    ds.section_count, ds.max_depth, dar.completed_at, dar.status;
