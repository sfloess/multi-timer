package com.flossware.multitimer.ui;

import com.flossware.multitimer.AppState;
import com.flossware.multitimer.model.TimerModel;

import javax.swing.*;
import java.awt.*;

public class ToolbarPanel extends JPanel {

    public ToolbarPanel(AppState state, TimerListPanel timerListPanel) {
        setLayout(new FlowLayout(FlowLayout.LEFT, 10, 10));
        setBackground(new Color(0x1E293B));

        // Add Timer Button
        JButton addButton = new JButton("Add Timer");
        addButton.addActionListener(e -> {
            String name = JOptionPane.showInputDialog(this, "Enter timer name:", "New Timer", JOptionPane.PLAIN_MESSAGE);
            if (name != null) {
                if (name.trim().isEmpty()) {
                    name = "Timer";
                }
                long duration = TimePickerDialog.showDialog(this, 300);
                TimerModel newModel = new TimerModel(name, duration);
                state.addTimer(newModel);
                timerListPanel.addTimer(newModel);
            }
        });

        // Delete Button
        JButton deleteButton = new JButton("Delete");
        deleteButton.addActionListener(e -> {
            TimerPanel selected = timerListPanel.getSelectedTimerPanel();
            if (selected != null) {
                state.removeTimer(selected.getTimerModel());
                timerListPanel.removeSelected();
            }
        });

        // Move Up Button
        JButton moveUpButton = new JButton("Move Up");
        moveUpButton.addActionListener(e -> timerListPanel.moveUp());

        // Move Down Button
        JButton moveDownButton = new JButton("Move Down");
        moveDownButton.addActionListener(e -> timerListPanel.moveDown());

        // Clear All Button
        JButton clearAllButton = new JButton("Clear All");
        clearAllButton.addActionListener(e -> {
            int confirm = JOptionPane.showConfirmDialog(this, "Are you sure you want to delete all timers?", "Confirm", JOptionPane.YES_NO_OPTION);
            if (confirm == JOptionPane.YES_OPTION) {
                state.clearTimers();
                timerListPanel.clearAll();
            }
        });

        // Settings Button
        JButton settingsButton = new JButton("Settings");
        settingsButton.addActionListener(e -> {
            new SettingsDialog((javax.swing.JFrame) javax.swing.SwingUtilities.getWindowAncestor(this), com.flossware.multitimer.service.ConfigService.getInstance()).setVisible(true);
        });

        add(addButton);
        add(deleteButton);
        add(moveUpButton);
        add(moveDownButton);
        add(clearAllButton);
        add(settingsButton);
    }
}


