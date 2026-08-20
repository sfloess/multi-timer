package com.flossware.multitimer.ui;

import javax.swing.*;
import java.awt.*;

public class TimePickerDialog extends JDialog {
    private final JSpinner hourSpinner;
    private final JSpinner minSpinner;
    private final JSpinner secSpinner;
    private boolean confirmed = false;

    public TimePickerDialog(Component parent, long initialSeconds) {
        super(parent instanceof Frame ? (Frame) parent : (Frame) SwingUtilities.getWindowAncestor(parent), "Set Timer Duration", true);
        
        long h = initialSeconds / 3600;
        long m = (initialSeconds % 3600) / 60;
        long s = initialSeconds % 60;

        hourSpinner = new JSpinner(new SpinnerNumberModel(h, 0, 99, 1));
        minSpinner = new JSpinner(new SpinnerNumberModel(m, 0, 59, 1));
        secSpinner = new JSpinner(new SpinnerNumberModel(s, 0, 59, 1));

        setLayout(new BorderLayout());
        JPanel contentPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 15, 20));
        
        contentPanel.add(createTimeField("Hrs:", hourSpinner));
        contentPanel.add(createTimeField("Min:", minSpinner));
        contentPanel.add(createTimeField("Sec:", secSpinner));

        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        JButton okButton = new JButton("OK");
        JButton cancelButton = new JButton("Cancel");

        okButton.addActionListener(e -> {
            confirmed = true;
            dispose();
        });

        cancelButton.addActionListener(e -> {
            confirmed = false;
            dispose();
        });

        buttonPanel.add(okButton);
        buttonPanel.add(cancelButton);

        add(contentPanel, BorderLayout.CENTER);
        add(buttonPanel, BorderLayout.SOUTH);

        pack();
        setLocationRelativeTo(parent);
        setResizable(false);
    }

    public static long showDialog(Component parent, long initialSeconds) {
        TimePickerDialog dialog = new TimePickerDialog(parent, initialSeconds);
        dialog.setVisible(true);
        if (dialog.isConfirmed()) {
            return dialog.getTotalSeconds();
        }
        return initialSeconds;
    }

    private JPanel createTimeField(String labelText, JSpinner spinner) {
        JPanel panel = new JPanel(new GridBagLayout());
        panel.setOpaque(false);
        GridBagConstraints gbc = new GridBagConstraints();
        
        JLabel label = new JLabel(labelText);
        JComponent editor = spinner.getEditor();
        if (editor instanceof JSpinner.DefaultEditor) {
            ((JSpinner.DefaultEditor) editor).getTextField().setColumns(4);
        }

        gbc.gridx = 0;
        gbc.gridy = 0;
        panel.add(label, gbc);

        gbc.gridx = 1;
        gbc.insets = new Insets(0, 5, 0, 0);
        panel.add(spinner, gbc);
        
        return panel;
    }

    public boolean isConfirmed() {
        return confirmed;
    }

    public long getTotalSeconds() {
        return ((Number) hourSpinner.getValue()).longValue() * 3600 +
               ((Number) minSpinner.getValue()).longValue() * 60 +
               ((Number) secSpinner.getValue()).longValue();
    }
}
