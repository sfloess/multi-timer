using System;
using System.Globalization;
using System.Windows.Data;
using System.Windows.Media;

namespace MultiTimer.Converters;

public class StatusColorConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is bool isRunning)
        {
            return isRunning ? new SolidColorBrush((Color)ColorConverter.ConvertFromString("#3B82F6")) 
                             : new SolidColorBrush((Color)ColorConverter.ConvertFromString("#64748B"));
        }

        return new SolidColorBrush(Colors.Gray);
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}
