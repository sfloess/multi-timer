using System;
using System.Windows;
using MultiTimer.Services;
using MultiTimer.ViewModels;

namespace MultiTimer.Views;

public partial class SettingsDialog : Window
{
    private readonly SettingsViewModel _viewModel;
    private readonly ConfigService _configService;
    private readonly DatabaseService _databaseService;

    public SettingsDialog(ConfigService configService, DatabaseService databaseService)
    {
        InitializeComponent();
        _configService = configService;
        _databaseService = databaseService;
        _viewModel = new SettingsViewModel(configService, databaseService);
        DataContext = _viewModel;
        Owner = Application.Current.MainWindow;
    }

    private void SaveButton_Click(object sender, RoutedEventArgs e)
    {
        if (_viewModel.Save())
        {
            DialogResult = true;
            Close();
        }
    }

    private void CancelButton_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private void BrowseButton_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new Microsoft.Win32.OpenFileDialog
        {
            Title = "Select SQLite Database File",
            Filter = "SQLite Database (*.db)|*.db|All Files (*.*)|*.*",
            CheckFileExists = false,
            CheckPathExists = true
        };

        if (dialog.ShowDialog() == true)
        {
            _viewModel.SqlitePath = dialog.FileName;
        }
    }

    private void TestConnectionButton_Click(object sender, RoutedEventArgs e)
    {
        _viewModel.TestConnection();
    }
}
