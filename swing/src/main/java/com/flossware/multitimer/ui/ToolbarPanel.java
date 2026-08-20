package com.flossware.multitimer.ui;

import com.flossware.multitimer.AppState;
import com.flossware.multitimer.model.TimerModel;

import javax.swing.*;
import java.awt.*;

public class ToolbarPanel extends JPanel {

    public ToolbarPanel(AppState state, TimerListPanel timerListPanel) {
        setLayout(new FlowLayout(FlowLayout.LEFT, 10, 10));
        setBackground(new Color(0x1E293B));

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

        add(addButton);
    }
}
