# Requirements Document

## Introduction

Simple productivity improvements to the existing jq transformation editor. Focus on enhancing current functionality with minimal new code.

## Requirements

### Requirement 1: More jq Patterns

**User Story:** As a jq user, I want more common patterns in the quick toolbar, so that I can build queries faster.

#### Acceptance Criteria

1. WHEN I look at the quick patterns toolbar THEN I SHALL see 15+ common jq operations instead of the current 6
2. WHEN I hover over a pattern THEN I SHALL see a helpful description
3. WHEN I click a pattern THEN it SHALL insert at my cursor position

### Requirement 2: Better Error Messages

**User Story:** As a jq user, I want clearer error messages, so that I can fix problems quickly.

#### Acceptance Criteria

1. WHEN a jq query fails THEN I SHALL see a more helpful error message
2. WHEN I have a field name typo THEN the system SHALL suggest available field names
3. WHEN my query returns no results THEN I SHALL see an explanation why

### Requirement 3: Quick Query History

**User Story:** As a jq user, I want to quickly reuse recent queries, so that I don't retype common patterns.

#### Acceptance Criteria

1. WHEN I execute a query THEN it SHALL be saved to a simple history list
2. WHEN I click a history button THEN I SHALL see my recent queries
3. WHEN I click a history item THEN it SHALL load that query

### Requirement 4: Better Field Suggestions

**User Story:** As a jq user, I want better autocomplete for JSON fields, so that I avoid typos.

#### Acceptance Criteria

1. WHEN I type "." THEN I SHALL see available fields from my JSON
2. WHEN I'm in an array context THEN I SHALL see fields from array items
3. WHEN I select a suggestion THEN it SHALL insert the correct field syntax

### Requirement 5: Basic Keyboard Shortcuts

**User Story:** As a jq user, I want keyboard shortcuts for common actions, so that I can work faster.

#### Acceptance Criteria

1. WHEN I press Ctrl/Cmd+Enter THEN my query SHALL execute
2. WHEN I press Ctrl/Cmd+/ THEN the current line SHALL toggle comment
3. WHEN I press Ctrl/Cmd+K THEN I SHALL see a simple command menu