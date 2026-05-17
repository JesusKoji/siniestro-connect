import { useIsMobileDevice } from "@/hooks/useIsMobileDevice";
import { MobileApp } from "@/apps/MobileApp";
import { DesktopApp } from "@/apps/DesktopApp";

const Index = () => {
  const isMobile = useIsMobileDevice();

  if (isMobile === null) {
    return <div className="min-h-screen gradient-surface" />;
  }

  return isMobile ? <MobileApp /> : <DesktopApp />;
};

export default Index;
