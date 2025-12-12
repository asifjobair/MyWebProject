-- Companies
CREATE TABLE companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255)
);


-- Company Contacts
CREATE TABLE company_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(100),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- Users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'User',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meetings
CREATE TABLE meetings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  medium VARCHAR(50),
  meeting_date DATETIME,
  discussed_matter TEXT,
  outcome TEXT,
  next_meeting_date DATE,
  next_meeting_topic VARCHAR(255),
  created_by INT,
  meeting_type VARCHAR(50),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Meeting With (Key Contacts)
CREATE TABLE meeting_with (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  user_id INT NOT NULL,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id),
  FOREIGN KEY (user_id) REFERENCES company_contacts(id)
);

-- Meeting Participants
CREATE TABLE meeting_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  user_id INT NOT NULL,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE meeting_minutes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NULL, 
  summary TEXT NOT NULL,
  decisions TEXT,
  action_items JSON,
  attendees JSON,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE zoom_meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL,
    duration INT DEFAULT 60,
    type INT DEFAULT 2, -- 1=instant, 2=scheduled
    zoom_meeting_id VARCHAR(100),
    join_url VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
