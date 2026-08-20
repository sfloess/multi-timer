package com.flossware.multitimer.ui;

import com.flossware.multitimer.model.TimerModel;
import com.flossware.multitimer.util.TimeFormatter;
import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.beans.PropertyChangeEvent;
import java.beans.PropertyChangeListener;

public class TimerPanel extends JPanel implements PropertyChangeListener {

    private TimerModel model;

    private JTextField nameField;
    private JLabel clockLabel;
    private final JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 5, 0));

    public TimerPanel(TimerModel model) {
        this.model = model;
        setLayout(new GridBagLayout());
        setBackground(new Color(0x0F172A));
        setForeground(Color.WHITE);
        setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(5, 5, 5, 5);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        // Name
        gbc.gridx = 0;
        gbc.gridy = 0;
        JLabel nameLabel = new JLabel("Name:");
        add(nameLabel, gbc);

        gbc.gridx = 1;
        nameField = new JTextField(model.getName(), 15);
        add(nameField, gbc);

        // Clock display
        gbc.gridx = 0;
        gbc.gridy = 1;
        gbc.gridwidth = 3;
        gbc.anchor = GridBagConstraints.CENTER;
        clockLabel = new JLabel("", SwingConstants.CENTER);
        clockLabel.setFont(clockLabel.getFont().deriveFont(24.f));
        add(clockLabel, gbc);

        // Buttons
        gbc.gridy = 2;
        gbc.gridwidth = 1;
        gbc.anchor = GridBagConstraints.CENTER;

        JButton startBtn = new JButton("Start");
        buttonPanel.add(startBtn);
        JButton pauseBtn = new JButton("Pause");
        buttonPanel.add(pauseBtn);
        JButton resetBtn = new JButton("Reset");
        buttonPanel.add(resetBtn);
        JButton durationBtn = new JButton("Set Duration");
        buttonPanel.add(durationBtn);
        JButton notesBtn = new JButton("Notes");
        buttonPanel.add(notesBtn);
        add(buttonPanel, gbc);

        // Action listeners
        startBtn.addActionListener(e -> startTimer());
        pauseBtn.addActionListener(e -> pauseTimer());
        resetBtn.addActionListener(e -> resetTimer());
        durationBtn.addActionListener(e -> setDuration());
        notesBtn.addActionListener(e -> editNotes());

        // Property change listener
        model.addPropertyChangeListener(this);
        updateDisplay();
    }

    private void startTimer() {
        if (model.getStatus() == TimerModel.Status.IDLE || model.getStatus() == TimerModel.Status.PAUSED) {
            model.setStatus(TimerModel.Status.RUNNING);
            // Ensure remaining seconds reflect total when starting
            if (model.getStatus() == TimerModel.Status.PAUSED) {
                model.setRemainingSeconds(model.getTotalSeconds());
            }
        }
    }

    private void pauseTimer() {
        if (model.getStatus() == TimerModel.Status.RUNNING) {
            model.setStatus(TimerModel.Status.PAUSED);
        }
    }

    private void resetTimer() {
        model.setStatus(TimerModel.Status.IDLE);
        // Reset remaining seconds to total (will be used when started again)
        model.setRemainingSeconds(model.getTotalSeconds());
    }

    private void setDuration() {
        TimePickerDialog dialog = new TimePickerDialog(this, model.getTotalSeconds());
        dialog.setVisible(true);
        long newTotal = dialog.getSelectedSeconds();
        if (newTotal >= 0) {
            model.setTotalSeconds(newTotal);
            if (model.getStatus() == TimerModel.Status.RUNNING) {
                model.setRemainingSeconds(newTotal);
            }
        }
    }

    private void editNotes() {
        String currentNotes = model.getNotes();
        JTextField field = new JTextField(currentNotes, 20);
        Object[] options = { "Save", "Cancel" };
        int result = JOptionPane.showOptionDialog(
                this,
                field,
                "Edit Notes",
                JOptionPane.DEFAULT_OPTION,
                JOptionPane.PLAIN_MESSAGE,
                null,
                options,
                "Save"
        );
        if (result == 0) {
            model.setNotes(field.getText());
        }
    }

    @Override
    public void propertyChange(PropertyChangeEvent evt) {
        String prop = evt.getPropertyName();
        if ("name".equals(prop)) {
            String newName = (String) evt.getNewValue();
            if (nameField != null) {
                nameField.setText(newName);
            }
        } else if ("remainingSeconds".equals(prop)) {
            updateClock();
        } else if ("status".equals(prop)) {
            if (model.getStatus() == TimerModel.Status.FINISHED) {
                Toolkit.getDefaultToolkit().beep();
                JOptionPane.showMessageDialog(this, "Timer completed!", "Alert", JOptionPane.INFORMATION_MESSAGE);
            }
        } else if ("totalSeconds".equals(prop)) {
            if (model.getStatus() == TimerModel.Status.RUNNING) {
                model.setRemainingSeconds(model.getTotalSeconds());
            }
            updateClock();
        }
    }

    private void updateClock() {
        long seconds = model.getRemainingSeconds();
        String time = TimeFormatter.formatHMS(seconds);
        clockLabel.setText(time);
    }
}
