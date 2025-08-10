import Paw from "./Paw";

interface PawLoadingProps {
    size?: number;
    bounce?: boolean;
}

const PawLoading = ({ size = 56, bounce = true }: PawLoadingProps) => {
    return (
        <div className="relative w-16 h-16">
            {/* Pulsing background effect */}
            <div className="absolute inset-0 animate-ping rounded-full bg-primary-200 opacity-30"></div>

            <div className={`absolute inset-0 flex items-center justify-center animate-${bounce ? 'bounce' : 'none'}`}>
                <Paw size={size} />
            </div>
        </div>
    );
}

export default PawLoading;