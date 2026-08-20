using System;
using System.Windows;

namespace MultiTimer.Views;

public partial class TimePickerDialog : Window
{
    public static readonly DependencyProperty HoursProperty =
        DependencyProperty.Register(nameof(Hours), typeof(int), typeof(TimePickerDialog),
            new FrameworkPropertyMetadata(0, FrameworkPropertyMetadataOptions.BindsTwoWayByDefault, OnTimeValueChanged));

    public static readonly DependencyProperty MinutesProperty =
        DependencyProperty.Register(nameof(Minutes), typeof(int), typeof(TimePickerDialog),
            new FrameworkPropertyMetadata(0, FrameworkPropertyMetadataOptions.BindsTwoWayByDefault, OnTimeValueChanged));

    public static readonly DependencyProperty SecondsProperty =
        DependencyProperty.Register(nameof(Seconds), typeof(int), typeof(TimePickerDialog),
            new FrameworkPropertyMetadata(0, FrameworkPropertyMetadataOptions.BindsTwoWayByDefault, OnTimeValueChanged));

    public int Hours
    {
        get => (int)GetValue(HoursProperty);
        set => SetValue(HoursProperty, Math.Clamp(value, 0, 99));
    }

    public int Minutes
    {
        get => (int)GetValue(MinutesProperty);
        set => SetValue(MinutesProperty, Math.Clamp(value, 0, 59));
    }

    public int Seconds
    {
        get => (int)GetValue(SecondsProperty);
        set => SetValue(SecondsProperty, Math.Clamp(value, 0, 59));
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

    private static void OnTimeValueChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is TimePickerDialog dialog)
        {
            if (e.Property == HoursProperty)
            {
                int val = (int)e.NewValue;
                if (val < 0) dialog.Hours = 0;
                else if (val > 99) dialog.Hours = 99;
            }
            else if (e.Property == MinutesProperty)
            {
                int val = (int)e.NewValue;
                if (val < 0) dialog.Minutes = 0;
                else if (val > 59) dialog.Minutes = 59;
            }
            else if (e.Property == SecondsProperty)
            {
                int val = (int)e.NewValue;
                if (val < 0) dialog.Seconds = 0;
                else if (val > 59) dialog.Seconds = 59;
            }
        }
    }

    private void OkButton_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = true;
        Close();
    }

    private void CancelButton_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }
}
