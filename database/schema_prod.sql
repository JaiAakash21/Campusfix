-- CampusFix production schema — for InfinityFree phpMyAdmin import
-- DO NOT include CREATE DATABASE or USE statements.
-- Select your pre-assigned database in phpMyAdmin, then import this file.
-- Run this file BEFORE seed_prod.sql.
-- Compatible with MySQL 5.7+

-- ─── users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            INT            NOT NULL AUTO_INCREMENT,
    name          VARCHAR(100)   NOT NULL,
    email         VARCHAR(255)   NOT NULL,
    password_hash VARCHAR(255)   NOT NULL,
    role          ENUM('student','staff','admin') NOT NULL DEFAULT 'student',
    status        ENUM('active','suspended')      NOT NULL DEFAULT 'active',
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── categories ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id          INT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_category_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── tickets ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
    id           INT          NOT NULL AUTO_INCREMENT,
    ticket_ref   VARCHAR(20)  NOT NULL,
    title        VARCHAR(255) NOT NULL,
    description  TEXT         NOT NULL,
    category_id  INT          NOT NULL,
    submitter_id INT          NOT NULL,
    assigned_to  INT              NULL DEFAULT NULL,
    status       ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
    priority     ENUM('low','medium','high')                    NOT NULL DEFAULT 'medium',
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ticket_ref (ticket_ref),
    KEY idx_status       (status),
    KEY idx_category_id  (category_id),
    KEY idx_submitter_id (submitter_id),
    KEY idx_assigned_to  (assigned_to),
    KEY idx_created_at   (created_at),
    CONSTRAINT fk_tickets_category  FOREIGN KEY (category_id)  REFERENCES categories (id) ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_submitter FOREIGN KEY (submitter_id) REFERENCES users      (id) ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_assignee  FOREIGN KEY (assigned_to)  REFERENCES users      (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── ticket_history (append-only audit log) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_history (
    id         INT     NOT NULL AUTO_INCREMENT,
    ticket_id  INT     NOT NULL,
    changed_by INT     NOT NULL,
    old_status ENUM('open','in_progress','resolved','closed')     NULL,
    new_status ENUM('open','in_progress','resolved','closed') NOT NULL,
    note       TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_th_ticket_id (ticket_id),
    CONSTRAINT fk_th_ticket     FOREIGN KEY (ticket_id)  REFERENCES tickets (id) ON DELETE CASCADE,
    CONSTRAINT fk_th_changed_by FOREIGN KEY (changed_by) REFERENCES users   (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── comments ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
    id         INT  NOT NULL AUTO_INCREMENT,
    ticket_id  INT  NOT NULL,
    author_id  INT  NOT NULL,
    body       TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_comments_ticket_id (ticket_id),
    CONSTRAINT fk_comments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users   (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── file_attachments ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS file_attachments (
    id            INT          NOT NULL AUTO_INCREMENT,
    ticket_id     INT          NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name   VARCHAR(255) NOT NULL,
    mime_type     VARCHAR(100) NOT NULL,
    size          INT          NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ticket_attachment (ticket_id),
    UNIQUE KEY uq_stored_name       (stored_name),
    CONSTRAINT fk_fa_ticket FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
