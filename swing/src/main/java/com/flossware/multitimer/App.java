package com.flossware.multitimer;

import com.formdev.flatlaf.FlatDarkLaf;
import com.flossware.multitimer.service.PersistenceService;
import com.flossware.multitimer.service.SoundService;
import com.flossware.multitimer.service.TimerService;
import com.flossware.multitimer.ui.TimerListPanel;
import com.flossware.multitimer.ui.ToolbarPanel;
import com.flossware.multitimer.model.TimerModel;

import javax.swing.*;
import java.awt.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;

public class App {
    public static void main(String[] args) {
        FlatDarkLaf.setup();
        
        SwingUtilities.invokeLater(() -> {
            final PersistenceService storage = new PersistenceService();
            AppState loadedState = storage.loadState();
            if (loadedState == null) {
                loadedState = new AppState();
                loadedState.addTimer(new TimerModel("Timer 1", 300));
            }
            final AppState state = loadedState;
            
            final SoundService soundService = new SoundService();
            final TimerService timerService = new TimerService(state, soundService);
            timerService.start();

            JFrame frame = new JFrame("Multi-Timer");
            frame.setDefaultCloseOperation(JFrame.DO_NOTHING_ON_CLOSE);
            frame.setSize(800, 600);
            frame.setLocationRelativeTo(null);

            TimerListPanel timerListPanel = new TimerListPanel();
            timerListPanel.setTimers(state.getTimers());

            ToolbarPanel toolbarPanel = new ToolbarPanel(state, timerListPanel);

            frame.setLayout(new BorderLayout());
            frame.add(toolbarPanel, BorderLayout.NORTH);
            frame.add(timerListPanel, BorderLayout.CENTER);

            frame.addWindowListener(new WindowAdapter() {
                @Override
                public void windowClosing(WindowEvent e) {
                    timerService.stop();
                    storage.saveState(state);
                    soundService.close();
                    System.exit(0);
                }
            });

            frame.setVisible(true);
        });
    }
}
