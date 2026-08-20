package com.flossware.multitimer.service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Service class that handles communication and connection management
 * for the SQLite local database file.
 */
public class DatabaseService {
    private static DatabaseService instance;
    private Connection connection;

    private DatabaseService() {
        initializeDatabase();
    }

    /**
     * Retrieves the singleton instance of DatabaseService.
     * @return DatabaseService instance.
     */
    public static synchronized DatabaseService getInstance() {
        if (instance == null) {
            instance = new DatabaseService();
        }
        return instance;
    }

    /**
     * Returns an active connection to the SQLite database.
     * @return Connection object.
     * @throws SQLException If a connection error occurs.
     */
    public synchronized Connection getConnection() throws SQLException {
        if (connection == null || connection.isClosed()) {
            String dbPath = ConfigService.getInstance().getDbPath();
            connection = DriverManager.getConnection("jdbc:sqlite:" + dbPath);
        }
        return connection;
    }

    /**
     * Closes the connection to the database.
     */
    public synchronized void closeConnection() {
        if (connection != null) {
            try {
                if (!connection.isClosed()) {
                    connection.close();
                }
            } catch (SQLException e) {
                System.err.println("Error closing database connection: " + e.getMessage());
            } finally {
                connection = null;
            }
        }
    }

    /**
     * Initializes database tables if they do not exist.
     */
    public synchronized void initializeDatabase() {
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement()) {
            // Create tables if necessary
            String sql = "CREATE TABLE IF NOT EXISTS timers (" +
                    "id TEXT PRIMARY KEY, " +
                    "name TEXT NOT NULL, " +
                    "total_seconds INTEGER NOT NULL, " +
                    "remaining_seconds INTEGER NOT NULL, " +
                    "status TEXT NOT NULL, " +
                    "notes TEXT" +
                    ");";
            stmt.execute(sql);
        } catch (SQLException e) {
            System.err.println("Database initialization failed: " + e.getMessage());
        }
    }
}
