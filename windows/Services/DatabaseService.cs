using System;
using System.Collections.Generic;
using Microsoft.Data.Sqlite;
using Npgsql;
using MultiTimer.Models;

namespace MultiTimer.Services;

public enum StorageMode
{
    Json,
    SQLite,
    PostgreSQL
}

public class DatabaseService
{
    private readonly StorageMode _storageMode;
    private readonly string _connectionString;
    private readonly string _sqliteFilePath;

    public DatabaseService(StorageMode storageMode, string connectionString, string sqliteFilePath = "")
    {
        _storageMode = storageMode;
        _connectionString = connectionString;
        _sqliteFilePath = sqliteFilePath;

        if (_storageMode == StorageMode.SQLite)
        {
            InitializeSQLite();
        }
    }

    private string GetSqliteConnectionString() => $"Data Source={_sqliteFilePath}";

    private void InitializeSQLite()
    {
        var directory = Path.GetDirectoryName(_sqliteFilePath);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        using var connection = new SqliteConnection(GetSqliteConnectionString());
        connection.Open();
        var command = connection.CreateCommand();
        command.CommandText = @"
            CREATE TABLE IF NOT EXISTS timers (
                id TEXT PRIMARY KEY,
                name TEXT,
                total_seconds INTEGER,
                remaining_seconds INTEGER,
                status TEXT,
                notes TEXT,
                position INTEGER
            );
        ";
        command.ExecuteNonQuery();
    }

    private void InitializePostgres()
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();
        var command = connection.CreateCommand();
        command.CommandText = @"
            CREATE TABLE IF NOT EXISTS timers (
                id TEXT PRIMARY KEY,
                name TEXT,
                total_seconds INTEGER,
                remaining_seconds INTEGER,
                status TEXT,
                notes TEXT,
                position INTEGER
            );
        ";
        command.ExecuteNonQuery();
    }

    public bool TestConnection(string connectionString)
    {
        try
        {
            using var connection = new NpgsqlConnection(connectionString);
            connection.Open();
            return true;
        }
        catch
        {
            return false;
        }
    }

    public void SaveTimer(TimerModel timer, int position = 0)
    {
        if (_storageMode == StorageMode.SQLite)
        {
            SaveTimerSqlite(timer, position);
        }
        else if (_storageMode == StorageMode.PostgreSQL)
        {
            SaveTimerPostgres(timer, position);
        }
    }

    private void SaveTimerSqlite(TimerModel timer, int position)
    {
        using var connection = new SqliteConnection(GetSqliteConnectionString());
        connection.Open();
        var command = connection.CreateCommand();
        command.CommandText = @"
            INSERT INTO timers (id, name, total_seconds, remaining_seconds, status, notes, position)
            VALUES (@id, @name, @total_seconds, @remaining_seconds, @status, @notes, @position)
            ON CONFLICT(id) DO UPDATE SET
                name = @name,
                total_seconds = @total_seconds,
                remaining_seconds = @remaining_seconds,
                status = @status,
                notes = @notes,
                position = @position;
        ";
        AddParameters(command, timer, position);
        command.ExecuteNonQuery();
    }

    private void SaveTimerPostgres(TimerModel timer, int position)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();
        var command = connection.CreateCommand();
        command.CommandText = @"
            INSERT INTO timers (id, name, total_seconds, remaining_seconds, status, notes, position)
            VALUES (@id, @name, @total_seconds, @remaining_seconds, @status, @notes, @position)
            ON CONFLICT (id) DO UPDATE SET
                name = @name,
                total_seconds = @total_seconds,
                remaining_seconds = @remaining_seconds,
                status = @status,
                notes = @notes,
                position = @position;
        ";
        AddParameters(command, timer, position);
        command.ExecuteNonQuery();
    }

    public void DeleteTimer(Guid id)
    {
        if (_storageMode == StorageMode.SQLite)
        {
            using var connection = new SqliteConnection(GetSqliteConnectionString());
            connection.Open();
            var command = connection.CreateCommand();
            command.CommandText = "DELETE FROM timers WHERE id = @id;";
            command.Parameters.AddWithValue("@id", id.ToString());
            command.ExecuteNonQuery();
        }
        else if (_storageMode == StorageMode.PostgreSQL)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();
            var command = connection.CreateCommand();
            command.CommandText = "DELETE FROM timers WHERE id = @id;";
            command.Parameters.AddWithValue("@id", id.ToString());
            command.ExecuteNonQuery();
        }
    }

    public void SaveAll(List<TimerModel> timers)
    {
        if (_storageMode == StorageMode.SQLite)
        {
            using var connection = new SqliteConnection(GetSqliteConnectionString());
            connection.Open();
            using var transaction = connection.BeginTransaction();
            
            var clearCommand = connection.CreateCommand();
            clearCommand.Transaction = transaction;
            clearCommand.CommandText = "DELETE FROM timers;";
            clearCommand.ExecuteNonQuery();

            for (int i = 0; i < timers.Count; i++)
            {
                var command = connection.CreateCommand();
                command.Transaction = transaction;
                command.CommandText = @"
                    INSERT INTO timers (id, name, total_seconds, remaining_seconds, status, notes, position)
                    VALUES (@id, @name, @total_seconds, @remaining_seconds, @status, @notes, @position);
                ";
                AddParameters(command, timers[i], i);
                command.ExecuteNonQuery();
            }

            transaction.Commit();
        }
        else if (_storageMode == StorageMode.PostgreSQL)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();
            using var transaction = connection.BeginTransaction();
            
            var clearCommand = connection.CreateCommand();
            clearCommand.Transaction = transaction;
            clearCommand.CommandText = "DELETE FROM timers;";
            clearCommand.ExecuteNonQuery();

            for (int i = 0; i < timers.Count; i++)
            {
                var command = connection.CreateCommand();
                command.Transaction = transaction;
                command.CommandText = @"
                    INSERT INTO timers (id, name, total_seconds, remaining_seconds, status, notes, position)
                    VALUES (@id, @name, @total_seconds, @remaining_seconds, @status, @notes, @position);
                ";
                AddParameters(command, timers[i], i);
                command.ExecuteNonQuery();
            }

            transaction.Commit();
        }
    }

    public List<TimerModel> LoadAll()
    {
        var timers = new List<TimerModel>();

        if (_storageMode == StorageMode.SQLite)
        {
            using var connection = new SqliteConnection(GetSqliteConnectionString());
            connection.Open();
            var command = connection.CreateCommand();
            command.CommandText = "SELECT id, name, total_seconds, remaining_seconds, status, notes, position FROM timers ORDER BY position;";
            using var reader = command.ExecuteReader();
            while (reader.Read())
            {
                timers.Add(MapReaderToTimer(reader));
            }
        }
        else if (_storageMode == StorageMode.PostgreSQL)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();
            var command = connection.CreateCommand();
            command.CommandText = "SELECT id, name, total_seconds, remaining_seconds, status, notes, position FROM timers ORDER BY position;";
            using var reader = command.ExecuteReader();
            while (reader.Read())
            {
                timers.Add(MapReaderToTimer(reader));
            }
        }

        return timers;
    }

    private TimerModel MapReaderToTimer(System.Data.Common.DbDataReader reader)
    {
        var timer = new TimerModel
        {
            Id = Guid.Parse(reader.GetString(0)),
            Name = reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
            Duration = TimeSpan.FromSeconds(reader.IsDBNull(2) ? 0 : reader.GetInt32(2)),
            Notes = reader.IsDBNull(5) ? string.Empty : reader.GetString(5)
        };

        var status = reader.IsDBNull(4) ? "Stopped" : reader.GetString(4);
        if (status == "Running")
        {
            timer.IsRunning = true;
            timer.Start();
        }

        return timer;
    }

    private void AddParameters(System.Data.Common.DbCommand command, TimerModel timer, int position)
    {
        command.Parameters.AddWithValue("@id", timer.Id.ToString());
        command.Parameters.AddWithValue("@name", timer.Name ?? string.Empty);
        command.Parameters.AddWithValue("@total_seconds", (int)timer.Duration.TotalSeconds);
        command.Parameters.AddWithValue("@remaining_seconds", (int)timer.Remaining.TotalSeconds);
        command.Parameters.AddWithValue("@status", timer.IsRunning ? "Running" : "Stopped");
        command.Parameters.AddWithValue("@notes", timer.Notes ?? string.Empty);
        command.Parameters.AddWithValue("@position", position);
    }
}
