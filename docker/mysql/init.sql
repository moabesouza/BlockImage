CREATE DATABASE IF NOT EXISTS BlockChain;

USE BlockChain;

CREATE TABLE IF NOT EXISTS usuarios (
  idusuarios INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Image (
  id INT AUTO_INCREMENT PRIMARY KEY,
  description TEXT,
  drone_manufacturer VARCHAR(255),
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lon DECIMAL(11, 8) NOT NULL,
  registrationdata DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  value DECIMAL(18, 8),
  link TEXT,
  AndresWallet VARCHAR(255),
  usuario_id INT,
  INDEX idx_image_location (location_lat, location_lon),
  INDEX idx_image_usuario (usuario_id),
  CONSTRAINT fk_image_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(idusuarios)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Image_compradas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image_id INT NOT NULL,
  usuario_id INT NOT NULL,
  link TEXT,
  data_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_compras_usuario (usuario_id),
  INDEX idx_compras_image (image_id),
  CONSTRAINT fk_compras_image
    FOREIGN KEY (image_id) REFERENCES Image(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_compras_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(idusuarios)
    ON DELETE CASCADE
);
