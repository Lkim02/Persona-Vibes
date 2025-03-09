import React from 'react';

// Component to display a list of tweets or replies
const TweetList = ({ items, type }) => {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div 
          key={index} 
          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm text-gray-900">{item.content}</p>
              {item.replyToTweetId && (
                <p className="text-xs text-gray-500 mt-1">
                  Replying to tweet: {item.replyToTweetId}
                </p>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {new Date(item.timestamp).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TweetList;
