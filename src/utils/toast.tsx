import Toast from 'react-native-toast-message';

// Define the valid toast types and positions
type ToastType = 1 | 2 | 3; // 1: success, 2: error, 3: info
type ToastPosition = 'top' | 'bottom';

interface ShowToastOptions {
  type?: ToastType;  // 1 = success, 2 = error, 3 = info
  title?: string;  // Notification title
  text?: string;  // Additional message text
  position?: ToastPosition;  // Toast position: top or bottom
  visibilityTime?: number;  // Time the toast stays visible (ms)
  autoHide?: boolean;  // Whether the toast should auto-hide
  bottomOffset?: number;  // Offset from the bottom (or top if position is 'top')
  [key: string]: any;  // Spread operator for additional custom options
}

const showToast = ({
  type = 3,  // Default to 'info' (represented by 3)
  title = 'Notification',  // Default title
  text = '',  // Default to empty string if no text is provided
  position = 'bottom',  // Default to 'bottom'
  visibilityTime = 2500,  // Default visibility time
  autoHide = true,  // Default to auto hide
  bottomOffset = 20,  // Default bottom offset
  ...options  // Spread operator to include additional custom options
}: ShowToastOptions = {}) => {

  // Map number to toast types
  const typeMap: { [key in ToastType]: 'success' | 'error' | 'info' } = {
    1: 'success',
    2: 'error',
    3: 'info'
  };

  // Validate and map the type to toast type string
  const toastType = typeMap[type] || 'info';

  // Validate position value
  const validPositions: ToastPosition[] = ['top', 'bottom'];
  const toastPosition: ToastPosition = validPositions.includes(position) ? position : 'bottom';

  // Show the toast
  Toast.show({
    type: toastType,
    text1: title,
    text2: text,
    position: toastPosition,
    visibilityTime,
    autoHide,
    bottomOffset,
    ...options  // Spread any additional options passed
  });
};

export default showToast;