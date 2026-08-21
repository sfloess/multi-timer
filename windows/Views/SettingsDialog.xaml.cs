using System.Windows;
using MultiTimer.Services;

namespace MultiTimer.Views;

public partial class SettingsDialog : Window
{
    private readonly ConfigService _configService;

    public SettingsDialog()
    {
        InitializeComponent();
        _configService = ConfigService.Instance;
        LoadConfig();
    }

    private void LoadConfig()
    {
        var config = _configService.GetConfig();
        SqlitePathBox.Text = config.SqlitePath;
        PgHostBox.Text = config.PgHost;
        PgPortBox.Text = config.PgPort.ToString();
        PgDatabaseBox.Text = config.PgDatabase;
        PgUserBox.Text = config.PgUser;
        PgPasswordBox.Password = config.PgPassword;

        StorageModeCombo.SelectedIndex = config.StorageMode switch
        {
            "sqlite" => 1,
            "postgresql" => 2,
            _ => 0
        };
    }

    private void SaveButton_Click(object sender, RoutedEventArgs e)
    {
        var config = _configService.GetConfig();
        config.StorageMode = StorageModeCombo.SelectedIndex switch
        {
            1 => "sqlite",
            2 => "postgresql",
            _ => "json"
        };
        config.SqlitePath = SqlitePathBox.Text;
        config.PgHost = PgHostBox.Text;
        if (int.TryParse(PgPortBox.Text, out int port))
            config.PgPort = port;
        config.PgDatabase = PgDatabaseBox.Text;
        config.PgUser = PgUserBox.Text;
        config.PgPassword = PgPasswordBox.Password;
        _configService.SaveConfig(config);
        DialogResult = true;
        Close();
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
            SqlitePathBox.Text = dialog.FileName;
        }
    }
}
