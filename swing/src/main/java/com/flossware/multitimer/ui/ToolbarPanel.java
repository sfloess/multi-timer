package com.flossware.multitimer.ui;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionListener;

public class ToolbarPanel extends JPanel {

    public interface ToolbarListener {
        void onAddTimer();
        void onDeleteTimer();
        void onMoveUp();
        void onMoveDown();
        void onClearAll();
    }

    private JButton addButton;
    private JButton deleteButton;
    private JButton moveUpButton;
    private JButton moveDownButton;
    private JButton clearAllButton;

    private ToolbarListener listener;

    public ToolbarPanel() {
        this(null);
    }

    public ToolbarPanel(ToolbarListener listener) {
        this.listener = listener;
        initUI();
    }

    public void setToolbarListener(ToolbarListener listener) {
        this.listener = listener;
    }

    private void initUI() {
        setLayout(new FlowLayout(FlowLayout.LEFT, 10, 8));
        setBackground(new Color(0x0F, 0x17, 0x2A));
        setBorder(BorderFactory.createMatteBorder(0, 0, 1, 0, new Color(0x33, 0x41, 0x55)));

        addButton = createButton("+ Add Timer", new Color(0x3B, 0x82, 0xF6), Color.WHITE);
        moveUpButton = createButton("▲ Move Up", new Color(0x1E, 0x29, 0x3B), Color.WHITE);
        moveDownButton = createButton("▼ Move Down", new Color(0x1E, 0x29, 0x3B), Color.WHITE);
        deleteButton = createButton("Delete Selected", new Color(0x1E, 0x29, 0x3B), new Color(0xF8, 0x71, 0x71));
        clearAllButton = createButton("Clear All", new Color(0x1E, 0x29, 0x3B), new Color(0xF8, 0x71, 0x71));

        addButton.addActionListener(e -> {
            if (listener != null) listener.onAddTimer();
        });
        moveUpButton.addActionListener(e -> {
            if (listener != null) listener.onMoveUp();
        });
        moveDownButton.addActionListener(e -> {
            if (listener != null) listener.onMoveDown();
        });
        deleteButton.addActionListener(e -> {
            if (listener != null) listener.onDeleteTimer();
        });
        clearAllButton.addActionListener(e -> {
            if (listener != null) listener.onClearAll();
        });

        add(addButton);
        add(createSeparator());
        add(moveUpButton);
        add(moveDownButton);
        add(createSeparator());
        add(deleteButton);
        add(clearAllButton);
    }

    private JButton createButton(String text, Color bg, Color fg) {
        JButton button = new JButton(text);
        button.setFont(new Font("SansSerif", Font.BOLD, 12));
        button.setBackground(bg);
        button.setForeground(fg);
        button.setFocusPainted(false);
        button.setCursor(new Cursor(Cursor.HAND_CURSOR));
        button.setMargin(new Insets(6, 12, 6, 12));
        return button;
    }

    private JComponent createSeparator() {
        JSeparator sep = new JSeparator(JSeparator.VERTICAL);
        sep.setPreferredSize(new Dimension(1, 24));
        sep.setForeground(new Color(0x33, 0x41, 0x55));
        sep.setBackground(new Color(0x33, 0x41, 0x55));
        return sep;
    }

    public JButton getAddButton() {
        return addButton;
    }

    public JButton getDeleteButton() {
        return deleteButton;
    }

    public JButton getMoveUpButton() {
        return moveUpButton;
    }

    public JButton getMoveDownButton() {
        return moveDownButton;
    }

    public JButton getClearAllButton() {
        return clearAllButton;
    }

    public void setSelectionState(boolean hasSelection, boolean canMoveUp, boolean canMoveDown) {
        deleteButton.setEnabled(hasSelection);
        moveUpButton.setEnabled(canMoveUp);
        moveDownButton.setEnabled(canMoveDown);
    }

    public void setAddAction(ActionListener action) {
        addButton.addActionListener(action);
    }

    public void setDeleteAction(ActionListener action) {
        deleteButton.addActionListener(action);
    }

    public void setMoveUpAction(ActionListener action) {
        moveUpButton.addActionListener(action);
    }

    public void setMoveDownAction(ActionListener action) {
        moveDownButton.addActionListener(action);
    }

    public void setClearAllAction(ActionListener action) {
        clearAllButton.addActionListener(action);
    }
}
