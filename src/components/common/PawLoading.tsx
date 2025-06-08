import Paw from "./Paw";

const PawLoading = () => {
    return (
        <div className="relative w-16 h-16">
            {/* Pulsing background effect */}
            <div className="absolute inset-0 animate-ping rounded-full bg-primary-200 opacity-30"></div>

            <div className="absolute inset-0 flex items-center justify-center animate-bounce">
                <Paw size={56} />
            </div>
        </div>
    );
}

export default PawLoading;