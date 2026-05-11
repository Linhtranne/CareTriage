import { Box, Typography, CircularProgress } from '@mui/material';
import { keyframes } from '@emotion/react';

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4,
          animation: `${float} 3s ease-in-out infinite`,
        }}
      >
        <CircularProgress
          variant="indeterminate"
          size={80}
          thickness={2}
          sx={{
            color: '#10b981',
            position: 'absolute',
          }}
        />
        <Box
          sx={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
            animation: `${pulse} 2s ease-in-out infinite`,
          }}
        >
          <Typography sx={{ color: 'white', fontWeight: 900, fontSize: '1.2rem' }}>CT</Typography>
        </Box>
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 800,
          color: '#064e3b',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          mt: 2,
        }}
      >
        {message}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#10b981',
              animation: `${pulse} 1.5s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default LoadingScreen;
