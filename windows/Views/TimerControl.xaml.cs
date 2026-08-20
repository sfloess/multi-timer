using System;
using System.Windows;
using System.Windows.Controls;
using MultiTimer.ViewModels;

namespace MultiTimer.Views
{
    public partial class TimerControl : UserControl
    {
        public TimerControl()
        {
            InitializeComponent();
        }

        private void OnStartClicked(object sender, RoutedEventArgs e)
        {
            if (DataContext is TimerViewModel vm)
                vm.StartCommand.Execute(null);
        }

        private void OnPauseClicked(object sender, RoutedEventArgs e)
        {
            if (DataContext is TimerViewModel vm)
                vm.PauseCommand.Execute(null);
        }

        private void OnResetClicked(object sender, RoutedEventArgs e)
        {
            if (DataContext is TimerViewModel vm)
                vm.ResetCommand.Execute(null);
        }

        private void OnSaveNameClicked(object sender, RoutedEventArgs e)
        {
            if (DataContext is TimerViewModel vm)
                vm.Name = txtName.Text;
        }

        private void OnSaveDurationClicked(object sender, RoutedEventArgs e)
        {
            if (DataContext is TimerViewModel vm)
            {
                vm.DurationHours = int.Parse(txtHours.Text);
                vm.DurationMinutes = int.Parse(txtMinutes.Text);
                vm.DurationSeconds = int.Parse(txtSeconds.Text);
            }
        }

        private void OnNotesClicked(object sender, RoutedEventArgs e)
        {
            if (DataContext is TimerViewModel vm)
                vm.ShowNotesCommand?.Execute(null);
        }
    }
}
