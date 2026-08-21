using System;
using System.Windows;

namespace MultiTimer.Views;

public partial class TimePickerDialog : Window
{
    public int Hours
    {
        get => int.TryParse(HoursBox.Text, out int h) ? Math.Clamp(h, 0, 99) : 0;
        set => HoursBox.Text = Math.Clamp(value, 0, 99).ToString();
    }

    public int Minutes
    {
        get => int.TryParse(MinutesBox.Text, out int m) ? Math.Clamp(m, 0, 59) : 0;
        set => MinutesBox.Text = Math.Clamp(value, 0, 59).ToString();
    }

    public int Seconds
    {
        get => int.TryParse(SecondsBox.Text, out int s) ? Math.Clamp(s, 0, 59) : 0;
        set => SecondsBox.Text = Math.Clamp(value, 0, 59).ToString();
    }

    public TimeSpan SelectedTime => new TimeSpan(Hours, Minutes, Seconds);

    public TimePickerDialog()
    {
        InitializeComponent();
    }

    public TimePickerDialog(TimeSpan initialTime) : this()
    {
        Hours = (int)initialTime.TotalHours;
        Minutes = initialTime.Minutes;
        Seconds = initialTime.Seconds;
    }

    private void HoursUp_Click(object sender, RoutedEventArgs e) => Hours = Math.Min(Hours + 1, 99);
    private void HoursDown_Click(object sender, RoutedEventArgs e) => Hours = Math.Max(Hours - 1, 0);
    private void MinutesUp_Click(object sender, RoutedEventArgs e) => Minutes = Math.Min(Minutes + 1, 59);
    private void MinutesDown_Click(object sender, RoutedEventArgs e) => Minutes = Math.Max(Minutes - 1, 0);
    private void SecondsUp_Click(object sender, RoutedEventArgs e) => Seconds = Math.Min(Seconds + 1, 59);
    private void SecondsDown_Click(object sender, RoutedEventArgs e) => Seconds = Math.Max(Seconds - 1, 0);

    private void Ok_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = true;
        Close();
    }

    private void Cancel_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }
}
