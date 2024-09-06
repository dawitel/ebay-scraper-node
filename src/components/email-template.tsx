// src/utils/email-template.tsx
import * as React from "react";
import ReactDOMServer from "react-dom/server";

interface EmailTemplateProps {
    firstName: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
    firstName,
}) => (
    <div>
        <h1>
            Hi {firstName}✋! This is the Scraped data from your last upload. Enjoy your data🎉!
        </h1>
    </div>
);

export const renderEmailTemplate = (props: EmailTemplateProps): string => {
    return ReactDOMServer.renderToStaticMarkup(<EmailTemplate {...props} />);
};
