import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import useAuthStore from '../../store/authStore';
import { registerSchema } from '../../utils/validationSchemas';

const Register = () => {
  const { register, isLoading, error } = useAuthStore();
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Initial form values
  const initialValues = {
    email: '',
    password: '',
    confirmPassword: '',
    privacyConsent: false,
  };

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const result = await register(values.email, values.password);
    setSubmitting(false);
    
    if (result.success) {
      setRegisteredEmail(values.email);
      setRegistrationSuccess(true);
      resetForm();
    }
  };

  // Registration success view
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Registration Successful!</h2>
            <p className="mt-2 text-gray-600">
              We've sent a confirmation email to <span className="font-medium">{registeredEmail}</span>
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Important</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Please check your email inbox and click on the confirmation link to activate your account.</p>
                    <p className="mt-1">If you don't see the email, please check your spam folder.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Go to login page
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        
        <Formik
          initialValues={initialValues}
          validationSchema={registerSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, touched, errors }) => (
            <Form className="mt-8 space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="email" className="sr-only">Email address</label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                      touched.email && errors.email ? 'border-red-500' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                    placeholder="Email address"
                  />
                  <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">Password</label>
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                      touched.password && errors.password ? 'border-red-500' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                    placeholder="Password"
                  />
                  <ErrorMessage name="password" component="div" className="text-red-500 text-xs mt-1" />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                  <Field
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                      touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                    placeholder="Confirm Password"
                  />
                  <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-xs mt-1" />
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <Field
                    id="privacyConsent"
                    name="privacyConsent"
                    type="checkbox"
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="privacyConsent" className="font-medium text-gray-700">
                    I agree to the privacy policy
                  </label>
                  <p className="text-gray-500">
                    By registering, you allow this extension to collect your Twitter/X tweets and replies.
                  </p>
                  <ErrorMessage name="privacyConsent" component="div" className="text-red-500 text-xs mt-1" />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  {isLoading ? 'Creating account...' : 'Register'}
                </button>
              </div>
              
              <div className="text-sm text-center">
                <p className="font-medium text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign in
                  </Link>
                </p>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Register;
