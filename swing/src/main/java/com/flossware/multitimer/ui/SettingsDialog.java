package com.flossware.multitimer.ui;

import com.flossware.multitimer.service.ConfigService;
import com.flossware.multitimer.service.DatabaseService;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

public class SettingsDialog extends JDialog {
    private final ConfigService configService;
    private final JTextField dbPathField;
    private final JCheckBox enableSoundCheckBox;
    private boolean confirmed = false;

    public SettingsDialog(Frame parent) {
        this(parent, null);
    }

    public SettingsDialog(Frame parent, ConfigService configService) {
        super(parent, "Settings", true);
        this.configService = configService;

        setLayout(new BorderLayout(10, 10));
        setSize(400, 250);
        setLocationRelativeTo(parent);

        JPanel mainPanel = new JPanel(new GridBagLayout());
        mainPanel.setBorder(BorderFactory.createEmptyBorder(15, 15, 15, 15));
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.insets = new Insets(5, 5, 5, 5);

        // Database Path Row
        gbc.gridx = 0;
        gbc.gridy = 0;
        mainPanel.add(new JLabel("Database Path:"), gbc);

        gbc.gridx = 1;
        gbc.weightx = 1.0;
        dbPathField = new JTextField(20);
        mainPanel.add(dbPathField, gbc);

        // Enable Sound Row
        gbc.gridx = 0;
        gbc.gridy = 1;
        gbc.weightx = 0.0;
        mainPanel.add(new JLabel("Enable Sound:"), gbc);

        gbc.gridx = 1;
        gbc.weightx = 1.0;
        enableSoundCheckBox = new JCheckBox();
        mainPanel.add(enableSoundCheckBox, gbc);

        add(mainPanel, BorderLayout.CENTER);

        // Buttons Panel
        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        JButton okButton = new JButton("OK");
        JButton cancelButton = new JButton("Cancel");

        okButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                confirmed = true;
                saveSettings();
                dispose();
            }
        });

        cancelButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                dispose();
            }
        });

        buttonPanel.add(okButton);
        buttonPanel.add(cancelButton);
        add(buttonPanel, BorderLayout.SOUTH);

        loadSettings();
    }

    private void loadSettings() {
        // Read configuration from service safely if present
    }

    private void saveSettings() {
        // Save configuration via service safely if present
    }

    public boolean isConfirmed() {
        return confirmed;
    }
}
