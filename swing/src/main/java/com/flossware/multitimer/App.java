package com.flossware.multitimer;

import com.formdev.flatlaf.FlatLaf;
import com.flossware.multitimer.service.TimerManager;
import com.flossware.multitimer.service.StorageService;
import javax.swing.*;
import java.awt.*;

public class App {
    public static void main(String[] args) {
        FlatLaf.setup();
        
        SwingUtilities.invokeLater(() -> {
            StorageService storage = new StorageService();
            AppState state = storage.loadState();
            if (state == null) {
                state = new AppState();
            }
            
            TimerManager manager = new TimerManager(state);
            manager.startHeartbeat();
            
            MainFrame frame = new MainFrame(state, manager);
            frame.setTitle("Multi-Timer");
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setExtendedState(JFrame.MAXIMIZED_BOTH);
            frame.setVisible(true);
        });
    }
}
