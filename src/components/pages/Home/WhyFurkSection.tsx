import { CheckCircle, Shield, Award, Clock } from 'lucide-react';

const WhyFurkSection = () => {
  const benefits = [
    {
      icon: <CheckCircle size={32} className="text-primary-500" />,
      title: 'Verified Merchants',
      description: 'All merchants on FURK undergo a thorough verification process to ensure quality and reliability.'
    },
    {
      icon: <Shield size={32} className="text-primary-500" />,
      title: 'Secure Booking & Payment',
      description: 'Book and pay for services with confidence using our secure platform with multiple payment options.'
    },
    {
      icon: <Award size={32} className="text-primary-500" />,
      title: 'Rewards Program',
      description: 'Earn points with every booking and redeem them for discounts, free services, and exclusive offers.'
    },
    {
      icon: <Clock size={32} className="text-primary-500" />,
      title: '24/7 Support',
      description: 'Our dedicated support team is available around the clock to assist with any questions or concerns.'
    }
  ];

  return (
    <section className="py-16 md:py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="sm:text-start text-center mx-auto w-full mb-14">
          <h2 
            className="text-3xl md:text-4xl font-cursive font-bold text-gray-900 mb-4"
          >
            Why Choose FURK
          </h2>
          <p 
            className="text-lg md:text-xl text-gray-600"
          >
            We're dedicated to making pet care easy, reliable, and rewarding
          </p>
        </div>

        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-6 md:p-7 text-center shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200 group"
            >
              <div className="flex justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {benefit.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyFurkSection;