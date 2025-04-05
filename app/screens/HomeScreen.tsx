import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler } from 'react-native-gesture-handler';

// Define the navigation types
type RootStackParamList = {
  Home: undefined;
  Register: undefined;
};

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_COUNT = 3;

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const handleContinue = () => {
    navigation.navigate('Register');
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === 4) {
      const offset = event.nativeEvent.translationX;
      let newSlide = activeSlide;

      if (offset < -50 && activeSlide < SLIDE_COUNT - 1) {
        newSlide = activeSlide + 1;
      } else if (offset > 50 && activeSlide > 0) {
        newSlide = activeSlide - 1;
      }

      // Smooth transition to the new slide
      Animated.spring(translateX, {
        toValue: -newSlide * SCREEN_WIDTH,
        useNativeDriver: true,
        friction: 8, // Adjust friction for smoother animation
      }).start();

      setActiveSlide(newSlide);
    }
  };

  // Create an array for all slides
  const slides = [
    {
      title: "Welcome to Aries!",
      tagline: "Revolutionize education through intelligent adaptive tutoring and AI-powered learning.",
      colors: ['#FF4500', '#FF8C00', '#FFA500'] // Orange theme
    },
    {
      title: "Personalized Learning",
      tagline: "Our AI adapts to your learning style and pace for maximum engagement and retention.",
      colors: ['#4169E1', '#1E90FF', '#00BFFF'] // Blue theme
    },
    {
      title: "Track Your Progress",
      tagline: "See your improvements and achievements with detailed analytics and progress tracking.",
      colors: ['#32CD32', '#7CFC00', '#98FB98'] // Green theme
    }
  ];

  const renderIndicators = () => {
    return (
      <View style={styles.indicatorContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              { backgroundColor: index === activeSlide ? 'white' : 'rgba(255,255,255,0.4)' }
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.8)', 'black']}
        style={styles.gradient}
      />
      
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.slidesContainer,
            {
              transform: [
                {
                  translateX: translateX.interpolate({
                    inputRange: [-SCREEN_WIDTH * (SLIDE_COUNT - 1), 0, SCREEN_WIDTH * (SLIDE_COUNT - 1)],
                    outputRange: [-SCREEN_WIDTH * (SLIDE_COUNT - 1), 0, SCREEN_WIDTH * (SLIDE_COUNT - 1)],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          {slides.map((slide, index) => (
            <Animated.View
              key={index}
              style={[
                styles.slideContent,
                {
                  opacity: translateX.interpolate({
                    inputRange: [
                      -SCREEN_WIDTH * (index + 1),
                      -SCREEN_WIDTH * index,
                      -SCREEN_WIDTH * (index - 1),
                    ],
                    outputRange: [0.5, 1, 0.5],
                    extrapolate: 'clamp',
                  }),
                  transform: [
                    {
                      scale: translateX.interpolate({
                        inputRange: [
                          -SCREEN_WIDTH * (index + 1),
                          -SCREEN_WIDTH * index,
                          -SCREEN_WIDTH * (index - 1),
                        ],
                        outputRange: [0.9, 1, 0.9],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.animationContainer}>
                <ParticleAnimation colors={slide.colors} activeSlide={activeSlide === index} />
              </View>
              <Animated.View
                style={[
                  styles.textContainer,
                  {
                    opacity: translateX.interpolate({
                      inputRange: [
                        -SCREEN_WIDTH * (index + 1),
                        -SCREEN_WIDTH * index,
                        -SCREEN_WIDTH * (index - 1),
                      ],
                      outputRange: [0, 1, 0],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              >
                <Text style={styles.logoText}>{slide.title}</Text>
                <Text style={styles.tagline}>{slide.tagline}</Text>
              </Animated.View>
            </Animated.View>
          ))}
        </Animated.View>
      </PanGestureHandler>

      {renderIndicators()}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Unified particle animation component
const ParticleAnimation = ({ colors, activeSlide }: { colors: string[], activeSlide: boolean }) => {
  const [particles] = useState(() => createSphereParticles(colors));

  useEffect(() => {
    if (activeSlide) {
      particles.forEach((particle) => {
        Animated.loop(
          Animated.timing(particle.animation, {
            toValue: 1,
            duration: 3000 + Math.random() * 2000, // Randomize duration between 3s and 5s
            delay: Math.random() * 1000, // Randomize delay up to 1s
            useNativeDriver: true,
          })
        ).start();
      });
    }
  }, [activeSlide, particles]);

  return (
    <View style={styles.particleContainer}>
      {particles.map((p, i) => {
        // Simulate rotation and movement
        const translateX = p.animation.interpolate({
          inputRange: [0, 1],
          outputRange: [p.startX, p.endX], // Move along the X-axis
        });

        const translateY = p.animation.interpolate({
          inputRange: [0, 1],
          outputRange: [p.startY, p.endY], // Move along the Y-axis
        });

        const translateZ = p.animation.interpolate({
          inputRange: [0, 1],
          outputRange: [p.startZ, p.endZ], // Simulate depth
        });

        const opacity = p.animation.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [p.minOpacity, p.maxOpacity, p.minOpacity],
        });

        const scale = p.animation.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [p.minScale, p.maxScale, p.minScale],
        });

        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.size / 2,
              opacity,
              transform: [
                { translateX },
                { translateY },
                { scale },
              ],
            }}
          />
        );
      })}
    </View>
  );
};

// Helper function to create particles
function createSphereParticles(colors: string[]) {
  const particles = [];
  const count = 200; // Number of particles
  const radius = 150; // Radius of the sphere
  const scaleFactor = 0.6; // Scale factor to make the globe smaller

  for (let i = 0; i < count; i++) {
    // Generate random spherical coordinates
    const theta = Math.random() * Math.PI * 2; // Angle around the Y-axis
    const phi = Math.acos(2 * Math.random() - 1); // Angle from the Z-axis

    // Convert spherical coordinates to Cartesian coordinates
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    // Randomize particle properties
    const size = 2 + Math.random() * 3; // Random size
    const colorIndex = i % colors.length;

    particles.push({
      color: colors[colorIndex],
      size,
      startX: x + Math.random() * 50 - 25, // Add randomness to starting position
      startY: y + Math.random() * 50 - 25,
      startZ: z + Math.random() * 50 - 25,
      endX: x * scaleFactor, // Scale down the final position
      endY: y * scaleFactor,
      endZ: z * scaleFactor,
      minOpacity: 0.3 + Math.random() * 0.2,
      maxOpacity: 0.7 + Math.random() * 0.3,
      minScale: 0.5 + Math.random() * 0.3,
      maxScale: 1 + Math.random() * 0.5,
      animation: new Animated.Value(0), // Individual animation value
    });
  }

  return particles;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  slidesContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
  },
  slideContent: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: 1 }], // Default scale
  },
  animationContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleContainer: {
    position: 'relative',
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH, // Make it a square to fit the sphere
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Prevent particles from overflowing
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
    opacity: 1, // Default opacity
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 50,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    width: '100%',
    maxWidth: 300,
  },
  buttonText: {
    fontSize: 18,
    color: 'black',
    textAlign: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});