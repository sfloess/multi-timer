package com.flossware.multitimer.service;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Properties;

/**
 * Service class that manages application configurations.
 * Persists settings to a properties file on disk.
 */
public class ConfigService {
    private static final String CONFIG_FILE_NAME = "multitimer-config.properties";
    private static ConfigService instance;
    private final Properties properties;

    private ConfigService() {
        properties = new Properties();
        loadConfiguration();
    }

    /**
     * Retrieves the singleton instance of ConfigService.
     * @return ConfigService instance.
     */
    public static synchronized ConfigService getInstance() {
        if (instance == null) {
            instance = new ConfigService();
        }
        return instance;
    }

    private void loadConfiguration() {
        File file = new File(CONFIG_FILE_NAME);
        if (file.exists()) {
            try (FileInputStream fis = new FileInputStream(file)) {
                properties.load(fis);
            } catch (IOException e) {
                System.err.println("Failed to load configuration: " + e.getMessage());
            }
        } else {
            // Set up default configuration parameters
            properties.setProperty("dbPath", "multitimer.db");
            properties.setProperty("theme", "dark");
            save();
        }
    }

    /**
     * Gets the path to the SQLite database.
     * @return Database path string.
     */
    public String getDbPath() {
        return properties.getProperty("dbPath", "multitimer.db");
    }

    /**
     * Sets the path to the SQLite database.
     * @param dbPath New database path.
     */
    public void setDbPath(String dbPath) {
        properties.setProperty("dbPath", dbPath);
    }

    /**
     * Saves the current configuration to disk.
     */
    public void save() {
        File file = new File(CONFIG_FILE_NAME);
        try (FileOutputStream fos = new FileOutputStream(file)) {
            properties.store(fos, "Multi-Timer Application Settings");
        } catch (IOException e) {
            System.err.println("Failed to save configuration: " + e.getMessage());
        }
    }

    /**
     * Gets custom property value.
     * @param key Property key.
     * @param defaultValue Default value if key is not found.
     * @return Property value.
     */
    public String getProperty(String key, String defaultValue) {
        return properties.getProperty(key, defaultValue);
    }

    /**
     * Sets a custom property.
     * @param key Property key.
     * @param value Property value.
     */
    public void setProperty(String key, String value) {
        properties.setProperty(key, value);
    }
}
