// Temporarily disabled native ad rendering to ensure web bundling succeeds.
// TODO: Implement native ads outside the `app/` directory to avoid expo-router's
// web require.context from including native-only modules in the web bundle.
const AdBanner = () => null;
export default AdBanner;
