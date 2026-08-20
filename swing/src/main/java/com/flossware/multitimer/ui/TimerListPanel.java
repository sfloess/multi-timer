package com.flossware.multitimer.ui;

import com.flossware.multitimer.model.TimerModel;
import javax.swing.*;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.util.List;

public class TimerListPanel extends JPanel {

    private final JPanel containerPanel;
    private TimerPanel selectedTimerPanel;

    public TimerListPanel() {
        setLayout(new BorderLayout());
        setBackground(new Color(0x0F172A));

        containerPanel = new JPanel();
        containerPanel.setLayout(new BoxLayout(containerPanel, BoxLayout.Y_AXIS));
        containerPanel.setBackground(new Color(0x0F172A));

        JScrollPane scrollPane = new JScrollPane(containerPanel);
        scrollPane.setBorder(BorderFactory.createEmptyBorder());
        scrollPane.getVerticalScrollBar().setUnitIncrement(16);
        add(scrollPane, BorderLayout.CENTER);
    }

    public void setTimers(List<TimerModel> timers) {
        containerPanel.removeAll();
        selectedTimerPanel = null;

        for (TimerModel model : timers) {
            TimerPanel p = new TimerPanel(model);
            setupPanelSelection(p);
            containerPanel.add(p);
            containerPanel.add(Box.createVerticalStrut(10));
        }

        containerPanel.add(Box.createVerticalGlue());
        containerPanel.revalidate();
        containerPanel.repaint();
    }

    public void addTimer(TimerModel model) {
        TimerPanel p = new TimerPanel(model);
        setupPanelSelection(p);
        
        // Remove vertical glue if present at the end
        int count = containerPanel.getComponentCount();
        if (count > 0 && containerPanel.getComponent(count - 1) instanceof Box.Filler) {
            containerPanel.remove(count - 1);
        }

        containerPanel.add(p);
        containerPanel.add(Box.createVerticalStrut(10));
        containerPanel.add(Box.createVerticalGlue());

        containerPanel.revalidate();
        containerPanel.repaint();
    }

    private void setupPanelSelection(TimerPanel panel) {
        panel.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                if (selectedTimerPanel != null) {
                    selectedTimerPanel.setBackground(new Color(0x1E293B));
                }
                selectedTimerPanel = panel;
                selectedTimerPanel.setBackground(new Color(0x334155));
            }
        });
    }
}
