import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Heading, Container } from '@chakra-ui/react';
import presentationService from '../../services/presentation';

export const PresentationPage = () => {
  const { id } = useParams();
  const [presentationInfo, setPresentationInfo] = useState(null);

  useEffect(() => {
    presentationService.get(id).then((info) => setPresentationInfo(info));
  }, [id]);

  return (
    <Container>
      {presentationInfo && (
        <div>
          <p>Name: {presentationInfo.name}</p>
          <p>Cues: {presentationInfo.cues}</p>
        </div>
      )}
    </Container>
  );
};

export default PresentationPage;
