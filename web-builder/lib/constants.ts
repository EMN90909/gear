import { 
  Heading1, 
  Text, 
  Image, 
  PanelTop, 
  PanelBottom 
} from 'lucide-react';

export const COMPONENT_TYPES = {
  heading: {
    text: "Heading",
    icon: Heading1
  },
  paragraph: {
    text: "Paragraph",
    icon: Text
  },
  image: {
    text: "Image",
    icon: Image
  },
  header: {
    text: "Header",
    icon: PanelTop
  },
  footer: {
    text: "Footer",
    icon: PanelBottom
  }
};
