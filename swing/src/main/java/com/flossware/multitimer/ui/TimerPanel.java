package com.flossware.multitimer.ui;

import com.flossware.multitimer.model.TimerModel;

import javax.swing.*;
import java.awt.*;
import java.beans.PropertyChangeEvent;
import java.beans.PropertyChangeListener;

public class TimerPanel extends JPanel implements PropertyChangeListener {
    private final TimerModel timerModel;
    private final JLabel nameLabel;
    private final JLabel timeLabel;
    private final JButton startPauseButton;
    private final JButton resetButton;
    private final JButton notesButton;
    private final JButton editButton;

    public TimerPanel(TimerModel timerModel) {
        this.timerModel = timerModel;
        this.timerModel.addPropertyChangeListener(this);

        setLayout(new BorderLayout(10, 10));
        setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(0x334155), 1),
                BorderFactory.createEmptyBorder(10, 15, 10, 15)
        ));
        setBackground(new Color(0x1E293B));

        nameLabel = new JLabel(timerModel.getName());
        nameLabel.setFont(new Font("SansSerif", Font.BOLD, 16));
        nameLabel.setForeground(Color.WHITE);

        timeLabel = new JLabel(formatTime(timerModel.getRemainingSeconds()));
        timeLabel.setFont(new Font("Monospaced", Font.BOLD, 28));
        timeLabel.setForeground(new Color(0x38BDF8));

        JPanel leftPanel = new JPanel(new GridLayout(2, 1, 0, 5));
        leftPanel.setOpaque(false);
        leftPanel.add(nameLabel);
        leftPanel.add(timeLabel);

        JPanel rightPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 5, 0));
        rightPanel.setOpaque(false);

        startPauseButton = new JButton(timerModel.isRunning() ? "Pause" : "Start");
        resetButton = new JButton("Reset");
        notesButton = new JButton("Notes");
        editButton = new JButton("Edit");

        startPauseButton.addActionListener(e -> {
            if (timerModel.isRunning()) {
                timerModel.pause();
            } else {
                timerModel.start();
            }
            updateButtonStates();
        });

        resetButton.addActionListener(e -> {
            timerModel.reset();
            updateButtonStates();
        });

        notesButton.addActionListener(e -> {
            NotesDialog notesDialog = new NotesDialog(timerModel);
            notesDialog.setVisible(true);
        });

        editButton.addActionListener(e -> {
            long newSeconds = TimePickerDialog.showDialog(this, timerModel.getTotalSeconds());
            timerModel.setTotalSeconds(newSeconds);
            timerModel.reset();
            updateButtonStates();
        });

        rightPanel.add(startPauseButton);
        rightPanel.add(resetButton);
        rightPanel.add(notesButton);
        rightPanel.add(editButton);

        add(leftPanel, BorderLayout.WEST);
        add(rightPanel, BorderLayout.EAST);

        updateButtonStates();
    }

    public TimerModel getTimerModel() {
        return timerModel;
    }

    private String formatTime(long seconds) {
        long h = seconds / 3600;
        long m = (seconds % 3600) / 60;
        long s = seconds % 60;
        if (h > 0) {
            return String.format("%02d:%02d:%02d", h, m, s);
        } else {
            return String.format("%02d:%02d", m, s);
        }
    }

    private void updateButtonStates() {
        if (timerModel.isRunning()) {
            startPauseButton.setText("Pause");
        } else {
            startPauseButton.setText("Start");
        }
    }

    @Override
    public void propertyChange(PropertyChangeEvent evt) {
        SwingUtilities.invokeLater(() -> {
            String prop = evt.getPropertyName();
            if ("remainingSeconds".equals(prop)) {
                timeLabel.setText(formatTime(timerModel.getRemainingSeconds()));
            } else if ("status".equals(prop)) {
                updateButtonStates();
            } else if ("name".equals(prop)) {
                nameLabel.setText(timerModel.getName());
            }
        });
    }
}
