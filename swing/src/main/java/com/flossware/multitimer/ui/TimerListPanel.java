package com.flossware.multitimer.ui;

import com.flossware.multitimer.model.TimerModel;
import javax.swing.*;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * A scrollable panel that displays TimerPanel instances in a vertical list.
 * Manages selection, ordering, and synchronization with the underlying TimerModel list.
 */
public class TimerListPanel extends JPanel {

    private final JPanel containerPanel;
    private final JScrollPane scrollPane;
    private TimerPanel selectedTimerPanel;
    private List<TimerModel> timerModels;

    private static final Color BACKGROUND_COLOR = new Color(0x0F172A);
    private static final Color SELECTION_BORDER_COLOR = new Color(0x00FFFF); // Cyan
    private static final int VERTICAL_STRUT_SIZE = 10;

    public TimerListPanel() {
        setLayout(new BorderLayout());
        setOpaque(false);

        // Initialize the container panel for the list items
        containerPanel = new JPanel();
        containerPanel.setLayout(new BoxLayout(containerPanel, BoxLayout.Y_AXIS));
        containerPanel.setBackground(BACKGROUND_COLOR);

        // Initialize the scroll pane
        scrollPane = new JScrollPane(containerPanel);
        scrollPane.setBorder(BorderFactory.createEmptyBorder());
        scrollPane.getVerticalScrollBar().setUnitIncrement(16);
        scrollPane.setOpaque(false);
        scrollPane.getViewport().setOpaque(false);

        add(scrollPane, BorderLayout.CENTER);
        
        timerModels = new ArrayList<>();
    }

    /**
     * Sets the master list of timers and rebuilds the UI.
     * @param timers The list of models to display.
     */
    public void setTimers(List<TimerModel> timers) {
        this.timerModels = timers;
        rebuildList();
    }

    /**
     * Adds a single timer to the end of the list.
     * @param model The new timer model.
     */
    public void addTimer(TimerModel model) {
        if (this.timerModels == null) {
            this.timerModels = new ArrayList<>();
        }
        this.timerModels.add(model);
        addTimerPanelToContainer(new TimerPanel(model));
    }

    /**
     * Returns the currently selected TimerPanel.
     * @return the selected TimerPanel or null if none.
     */
    public TimerPanel getSelectedTimerPanel() {
        return selectedTimerPanel;
    }

    /**
     * Removes the currently selected timer from the model list and the UI.
     */
    public void removeSelected() {
        if (selectedTimerPanel != null) {
            TimerModel modelToRemove = selectedTimerPanel.getTimerModel();
            timerModels.remove(modelToRemove);
            clearAllInternal();
            rebuildList();
        }
    }

    /**
     * Moves the selected timer one position up in the list.
     */
    public void moveUp() {
        if (selectedTimerPanel == null) return;

        int currentIndex = -1;
        for (int i = 0; i < containerPanel.getComponentCount(); i++) {
            if (containerPanel.getComponent(i) instanceof TimerPanel && 
                containerPanel.getComponent(i) == selectedTimerPanel) {
                currentIndex = i;
                break;
            }
        }

        // Because we have struts, the index in containerPanel isn't the same as index in timerModels
        // We need to find the index in the timerModels list
        currentIndex = timerModels.indexOf(selectedTimerPanel.getTimerModel());

        if (currentIndex > 0) {
            Collections.swap(timerModels, currentIndex, currentIndex - 1);
            rebuildList();
            // Re-select the panel after rebuild
            selectPanel(selectedTimerPanel.getTimerModel());
        }
    }

    /**
     * Moves the selected timer one position down in the list.
     */
    public void moveDown() {
        if (selectedTimerPanel == null) return;

        int currentIndex = timerModels.indexOf(selectedTimerPanel.getTimerModel());

        if (currentIndex != -1 && currentIndex < timerModels.size() - 1) {
            Collections.swap(timerModels, currentIndex, currentIndex + 1);
            rebuildList();
            // Re-select the panel after rebuild
            selectPanel(selectedTimerPanel.getTimerModel());
        }
    }

    /**
     * Removes all timer panels and clears the model list.
     */
    public void clearAll() {
        timerModels.clear();
        clearAllInternal();
        rebuildList();
    }

    private void clearAllInternal() {
        containerPanel.removeAll();
        selectedTimerPanel = null;
    }

    private void rebuildList() {
        clearAllInternal();
        for (TimerModel model : timerModels) {
            addTimerPanelToContainer(new TimerPanel(model));
        }
        
        // Add glue at the end to push components to the top
        containerPanel.add(Box.createVerticalGlue());
        
        containerPanel.revalidate();
        containerPanel.repaint();
    }

    private void addTimerPanelToContainer(TimerPanel panel) {
        // Add selection listener
        panel.addMouseListener(new MouseAdapter() {
            @Override
            public void mousePressed(MouseEvent e) {
                selectPanel(panel);
            }
        });

        containerPanel.add(panel);
        // Add vertical spacer (strut) between items
        containerPanel.add(Box.createVerticalStrut(VERTICAL_STRUT_SIZE));
    }

    /**
     * Handles the visual selection logic.
     * @param panel The panel to select.
     */
    private void selectPanel(TimerPanel panel) {
        // Deselect previous
        if (selectedTimerPanel != null) {
            // Reset border to default (null or a standard border)
            selectedTimerPanel.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));
        }

        // Select new
        selectedTimerPanel = panel;
        if (selectedTimerPanel != null) {
            selectedTimerPanel.setBorder(BorderFactory.createLineBorder(SELECTION_BORDER_COLOR, 2));
        }
        
        containerPanel.revalidate();
        containerPanel.repaint();
    }

    /**
     * Helper to re-select a panel by its model after a list rebuild.
     */
    private void selectPanel(TimerModel model) {
        for (Component comp : containerPanel.getComponents()) {
            if (comp instanceof TimerPanel) {
                TimerPanel tp = (TimerPanel) comp;
                if (tp.getTimerModel().equals(model)) {
                    selectPanel(tp);
                    return;
                }
            }
        }
    }
}
