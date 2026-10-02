CREATE TABLE IF NOT EXISTS lore_categories (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS lore_entries (
    id BIGSERIAL PRIMARY KEY,
    bungie_id VARCHAR(100) UNIQUE NOT NULL,
    source_game VARCHAR(12) NOT NULL DEFAULT 'destiny2',
    source_url VARCHAR(500),
    image_url VARCHAR(500),
    image_kind VARCHAR(12),
    category_id BIGINT REFERENCES lore_categories(id) ON DELETE SET NULL,
    title_en VARCHAR(255) NOT NULL,
    title_es VARCHAR(255),
    subtitle_es VARCHAR(255),
    content_en TEXT NOT NULL DEFAULT '',
    content_es TEXT,
    ai_summary_es TEXT,
    chronological_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE lore_entries ADD COLUMN IF NOT EXISTS source_game VARCHAR(12) NOT NULL DEFAULT 'destiny2';
ALTER TABLE lore_entries ADD COLUMN IF NOT EXISTS source_url VARCHAR(500);
ALTER TABLE lore_entries ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE lore_entries ADD COLUMN IF NOT EXISTS image_kind VARCHAR(12);

CREATE INDEX IF NOT EXISTS lore_entries_title_en_idx ON lore_entries (title_en);
CREATE INDEX IF NOT EXISTS lore_entries_title_es_idx ON lore_entries (title_es);
CREATE INDEX IF NOT EXISTS lore_entries_chronological_order_idx ON lore_entries (chronological_order);
CREATE INDEX IF NOT EXISTS lore_entries_source_game_idx ON lore_entries (source_game);

CREATE TABLE IF NOT EXISTS lore_groups (
    id BIGSERIAL PRIMARY KEY,
    source_game VARCHAR(12) NOT NULL,
    group_type VARCHAR(16) NOT NULL CHECK (group_type IN ('category', 'book', 'release')),
    bungie_id VARCHAR(100) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    title_es VARCHAR(255),
    image_url VARCHAR(500),
    source_url VARCHAR(500),
    release_number INT,
    release_order INT,
    release_slug VARCHAR(120),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (source_game, group_type, bungie_id)
);

ALTER TABLE lore_groups ADD COLUMN IF NOT EXISTS release_order INT;
ALTER TABLE lore_groups ADD COLUMN IF NOT EXISTS release_slug VARCHAR(120);
ALTER TABLE lore_groups DROP COLUMN IF EXISTS reference_url;
ALTER TABLE lore_groups DROP COLUMN IF EXISTS metadata_source;
ALTER TABLE lore_groups DROP COLUMN IF EXISTS declared_count;
ALTER TABLE lore_groups DROP COLUMN IF EXISTS release_date;
ALTER TABLE lore_groups DROP COLUMN IF EXISTS card_count;
ALTER TABLE lore_groups DROP COLUMN IF EXISTS transcript_count;
ALTER TABLE lore_groups DROP COLUMN IF EXISTS item_count;
DELETE FROM lore_groups
WHERE bungie_id LIKE 'ishtar:%' OR bungie_id LIKE 'reference:%';

DROP TABLE IF EXISTS release_bungie_items;
DROP TABLE IF EXISTS release_archive_updates;
DROP TABLE IF EXISTS release_archive_documents;
DROP TABLE IF EXISTS ishtar_documents;
DROP TABLE IF EXISTS ishtar_timeline_events;
DROP TABLE IF EXISTS ishtar_books;

CREATE TABLE IF NOT EXISTS lore_group_entries (
    group_id BIGINT NOT NULL REFERENCES lore_groups(id) ON DELETE CASCADE,
    lore_entry_id BIGINT NOT NULL REFERENCES lore_entries(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (group_id, lore_entry_id)
);

CREATE INDEX IF NOT EXISTS lore_groups_type_title_idx
    ON lore_groups (group_type, title_es, title_en);
CREATE INDEX IF NOT EXISTS lore_groups_release_slug_idx
    ON lore_groups (release_slug) WHERE release_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS lore_group_entries_entry_idx ON lore_group_entries (lore_entry_id);

CREATE TABLE IF NOT EXISTS game_catalog_entries (
    id BIGSERIAL PRIMARY KEY,
    source_game VARCHAR(12) NOT NULL,
    bungie_id VARCHAR(100) NOT NULL,
    category VARCHAR(24) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    title_es VARCHAR(255),
    summary_es VARCHAR(500),
    description_en TEXT,
    description_es TEXT,
    flavor_text_en TEXT,
    flavor_text_es TEXT,
    image_url VARCHAR(500),
    image_kind VARCHAR(12),
    source_url VARCHAR(500),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (source_game, bungie_id)
);

ALTER TABLE game_catalog_entries ADD COLUMN IF NOT EXISTS summary_es VARCHAR(500);
ALTER TABLE game_catalog_entries ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE game_catalog_entries ADD COLUMN IF NOT EXISTS description_es TEXT;
ALTER TABLE game_catalog_entries ADD COLUMN IF NOT EXISTS flavor_text_en TEXT;
ALTER TABLE game_catalog_entries ADD COLUMN IF NOT EXISTS flavor_text_es TEXT;
ALTER TABLE game_catalog_entries ADD COLUMN IF NOT EXISTS image_kind VARCHAR(12);
ALTER TABLE game_catalog_entries ADD COLUMN IF NOT EXISTS rarity VARCHAR(80);
ALTER TABLE game_catalog_entries ADD COLUMN IF NOT EXISTS class_type SMALLINT;
ALTER TABLE game_catalog_entries ADD COLUMN IF NOT EXISTS item_type VARCHAR(120);
ALTER TABLE game_catalog_entries ADD COLUMN IF NOT EXISTS icon_url VARCHAR(500);

CREATE INDEX IF NOT EXISTS game_catalog_category_title_idx
    ON game_catalog_entries (category, title_es, title_en);

CREATE INDEX IF NOT EXISTS game_catalog_game_idx ON game_catalog_entries (source_game);
CREATE INDEX IF NOT EXISTS game_catalog_equipment_filter_idx
    ON game_catalog_entries (category, rarity, class_type)
    WHERE category IN ('weapons', 'armor', 'objects');

CREATE TABLE IF NOT EXISTS release_catalog_entries (
    release_slug VARCHAR(120) NOT NULL,
    catalog_entry_id BIGINT NOT NULL REFERENCES game_catalog_entries(id) ON DELETE CASCADE,
    ishtar_item_slug VARCHAR(180) NOT NULL,
    PRIMARY KEY (release_slug, catalog_entry_id)
);

CREATE INDEX IF NOT EXISTS release_catalog_entries_slug_idx
    ON release_catalog_entries (release_slug, catalog_entry_id);

CREATE TABLE IF NOT EXISTS app_sync_state (
    sync_key VARCHAR(80) PRIMARY KEY,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DELETE FROM app_sync_state
WHERE sync_key LIKE 'ishtar-%'
   OR sync_key IN ('release-archive-v1', 'release-bungie-items-v1');

CREATE TABLE IF NOT EXISTS lore_cinematics (
    id BIGSERIAL PRIMARY KEY,
    lore_entry_id BIGINT NOT NULL REFERENCES lore_entries(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    youtube_url VARCHAR(500) NOT NULL,
    source_url VARCHAR(500) NOT NULL,
    language VARCHAR(12) NOT NULL DEFAULT 'es',
    expansion_tag VARCHAR(100),
    description TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (lore_entry_id, youtube_url)
);

CREATE INDEX IF NOT EXISTS lore_cinematics_entry_verified_idx
    ON lore_cinematics (lore_entry_id, is_verified);

CREATE TABLE IF NOT EXISTS lore_translation_limits (
    limit_key VARCHAR(80) NOT NULL,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    request_count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (limit_key, request_date)
);
