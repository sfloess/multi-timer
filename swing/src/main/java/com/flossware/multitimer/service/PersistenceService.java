package com.flossware.multitimer.service;

import com.flossware.multitimer.AppState;
import com.flossware.multitimer.model.TimerModel;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

public class PersistenceService {

    private final Path filePath;
    private final Gson gson;

    public PersistenceService() {
        String homeDir = System.getProperty("user.home");
        Path dirPath = Paths.get(homeDir, ".multi-timer");
        this.filePath = dirPath.resolve("timers.json");
        this.gson = new GsonBuilder().setPrettyPrinting().create();
    }

    public void saveState(AppState state) {
        try {
            Files.createDirectories(filePath.getParent());
            try (FileWriter writer = new FileWriter(filePath.toFile())) {
                gson.toJson(state, writer);
            }
        } catch (IOException e) {
            System.err.println("Failed to save state: " + e.getMessage());
        }
    }

    public void saveTimers(List<TimerModel> timers) {
        AppState state = new AppState();
        state.setTimers(timers);
        saveState(state);
    }

    public AppState loadState() {
        File file = filePath.toFile();
        if (!file.exists()) {
            return null;
        }

        try (FileReader reader = new FileReader(file)) {
            AppState state = gson.fromJson(reader, AppState.class);
            if (state == null) {
                // Try reading as a direct list of timers for backward compatibility
                reader.close();
                try (FileReader listReader = new FileReader(file)) {
                    Type listType = new TypeToken<List<TimerModel>>() {}.getType();
                    List<TimerModel> timers = gson.fromJson(listReader, listType);
                    if (timers != null) {
                        state = new AppState();
                        state.setTimers(timers);
                    }
                }
            }
            return state;
        } catch (Exception e) {
            System.err.println("Failed to load state: " + e.getMessage());
            return null;
        }
    }

    public List<TimerModel> loadTimers() {
        AppState state = loadState();
        return state != null ? state.getTimers() : null;
    }
}
