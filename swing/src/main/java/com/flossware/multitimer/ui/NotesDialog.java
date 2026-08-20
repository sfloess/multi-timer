package com.flossware.multitimer.ui;

import com.flossware.multitimer.model.TimerModel;

import javax.swing.*;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import java.awt.*;
import java.beans.PropertyChangeEvent;
import java.beans.PropertyChangeListener;

public class NotesDialog extends JDialog implements PropertyChangeListener {
    private final JTextArea notesArea;
    private final TimerModel timer;

    public NotesDialog(TimerModel timer) {
        super((Frame) null, "Notes Editor", true);
        this.timer = timer;
        setLayout(new BorderLayout(10, 10));
        setSize(400, 300);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(DISPOSE_ON_CLOSE);

        notesArea = new JTextArea();
        notesArea.setText(timer.getNotes());
        notesArea.setFont(new Font("Arial", Font.PLAIN, 14));
        notesArea.getDocument().addDocumentListener(new DocumentListener() {
            private void updateNotes() {
                timer.setNotes(notesArea.getText());
            }

            @Override
            public void insertUpdate(DocumentEvent e) {
                updateNotes();
            }

            @Override
            public void removeUpdate(DocumentEvent e) {
                updateNotes();
            }

            @Override
            public void changedUpdate(DocumentEvent e) {
                updateNotes();
            }
        });

        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 10));
        JButton okButton = new JButton("OK");
        JButton cancelButton = new JButton("Cancel");

        okButton.addActionListener(e -> {
            timer.setNotes(notesArea.getText());
            dispose();
        });

        cancelButton.addActionListener(e -> dispose());

        buttonPanel.add(okButton);
        buttonPanel.add(cancelButton);

        add(new JScrollPane(notesArea), BorderLayout.CENTER);
        add(buttonPanel, BorderLayout.SOUTH);
    }

    @Override
    public void propertyChange(PropertyChangeEvent evt) {
        if ("notes".equals(evt.getPropertyName())) {
            notesArea.setText(timer.getNotes());
        }
    }
}
