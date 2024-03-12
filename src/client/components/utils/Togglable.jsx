import { useState, useImperativeHandle, forwardRef } from 'react';
import { Button, Box } from '@chakra-ui/react';

const Togglable = forwardRef(({ buttonLabel, exitLabel, children }, ref) => {
  const [visible, setVisible] = useState(false);

  const toggleVisibility = () => {
    setVisible(!visible);
  };

  useImperativeHandle(ref, () => ({
    toggleVisibility,
  }));

  return (
    <Box>
      {!visible && (
        <Button onClick={toggleVisibility}>{buttonLabel}</Button>
      )}
      {visible && (
        <Box>
          {children}
          <Button onClick={toggleVisibility}>{exitLabel}</Button>
        </Box>
      )}
    </Box>
  );
});

export default Togglable;