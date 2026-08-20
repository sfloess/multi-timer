using System.Windows;

namespace MultiTimer.Views
{
    public partial class NotesDialog
    {
        public NotesDialog()
        {
            InitializeComponent();
        }

        public string Notes
        {
            get => NotesTextBox.Text;
            set => NotesTextBox.Text = value;
        }

        private void CancelButton_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
        }

        private void SaveButton_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = true;
        }
    }
}
