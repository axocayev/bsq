export const TYPE_KEYS = ['SINGLE_SELECT', 'MULTI_SELECT', 'TRUE_FALSE', 'OPEN'];

export const typeColor = {
  SINGLE_SELECT: 'blue',
  MULTI_SELECT:  'purple',
  TRUE_FALSE:    'cyan',
  OPEN:          'orange',
};

export const typeLabel = (type, t) => t(`questionTypes.${type}`, type);
