\set ON_ERROR_STOP 0
CREATE TABLE account (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  scope text NOT NULL CHECK (scope IN ('private','business')),
  parent_id bigint,
  is_top_level boolean NOT NULL CHECK (is_top_level = (parent_id IS NULL)),
  parent_is_top boolean CHECK (parent_is_top),
  CHECK ((parent_id IS NULL) = (parent_is_top IS NULL)),
  UNIQUE (id, is_top_level, scope),
  FOREIGN KEY (parent_id, parent_is_top, scope) REFERENCES account (id, is_top_level, scope) ON UPDATE CASCADE
);
CREATE TABLE category (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('income','expense')),
  parent_id bigint,
  UNIQUE (id, kind)
);
CREATE UNIQUE INDEX ON category (kind, parent_id, lower(name)) NULLS NOT DISTINCT;
CREATE TABLE booking (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('income','expense','transfer','correction')),
  category_id bigint,
  CHECK ((kind IN ('income','expense')) = (category_id IS NOT NULL)),
  FOREIGN KEY (category_id, kind) REFERENCES category (id, kind)
);
INSERT INTO account (name, scope, is_top_level) VALUES ('Giro','private',true);           -- 1
INSERT INTO account (name, scope, parent_id, is_top_level, parent_is_top) VALUES ('Notgroschen','private',1,false,true); -- 2
\echo '--- expect FAIL: sub-account with other scope'
INSERT INTO account (name, scope, parent_id, is_top_level, parent_is_top) VALUES ('X','business',1,false,true);
\echo '--- expect FAIL: sub of sub'
INSERT INTO account (name, scope, parent_id, is_top_level, parent_is_top) VALUES ('Y','private',2,false,true);
\echo '--- expect FAIL: child changes scope alone'
UPDATE account SET scope='business' WHERE id=2;
\echo '--- expect OK: parent scope cascades'
UPDATE account SET scope='business' WHERE id=1;
SELECT id,name,scope FROM account ORDER BY id;
INSERT INTO account (name, scope, is_top_level) VALUES ('Bar','private',true);  -- id 6ish
\echo '--- expect FAIL: parent with children becomes sub'
UPDATE account SET parent_id=(SELECT id FROM account WHERE name='Bar'), is_top_level=false, parent_is_top=true, scope='private' WHERE id=1;
INSERT INTO category (name, kind) VALUES ('Gehalt','income'),('Wohnen','expense');
\echo '--- expect OK: expense on expense category, transfer without category'
INSERT INTO booking (kind, category_id) VALUES ('expense',2),('transfer',NULL);
\echo '--- expect FAIL: expense on income category'
INSERT INTO booking (kind, category_id) VALUES ('expense',1);
\echo '--- expect FAIL: duplicate main name (NULLS NOT DISTINCT)'
INSERT INTO category (name, kind) VALUES ('wohnen','expense');
