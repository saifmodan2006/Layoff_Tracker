CREATE TABLE layoffs (
  id UUID PRIMARY KEY,
  company TEXT NOT NULL,
  industry TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  date DATE NOT NULL,
  count INTEGER NOT NULL,
  percent_of_workforce NUMERIC(5,2) NOT NULL,
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  source_url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_layoffs_company ON layoffs (company);
CREATE INDEX idx_layoffs_date ON layoffs (date);
CREATE INDEX idx_layoffs_country ON layoffs (country);
CREATE INDEX idx_layoffs_industry ON layoffs (industry);
CREATE INDEX idx_layoffs_stage ON layoffs (stage);
