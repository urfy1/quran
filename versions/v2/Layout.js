import { Outlet, Link } from "react-router-dom";
import { Icon } from '@chakra-ui/react'
import {  Container, ChakraProvider } from '@chakra-ui/react'
import {
  List,
  ListItem,
  ListIcon,
  OrderedList,
  UnorderedList,
} from '@chakra-ui/react'
import { Tabs, TabList, TabPanels, Tab, TabPanel, useTab } from '@chakra-ui/react'


const Layout = () => {
  return (<ChakraProvider>
    <Container>
    <>



    <Tabs isFitted variant='enclosed' colorScheme='green' align='center'>
  <TabList>
  
    <Tab>Quran Chapters</Tab>


  </TabList>

  <TabPanels>


   


  </TabPanels>
</Tabs>
<Outlet />
    </>
    </Container>
    </ChakraProvider>
  )
};

export default Layout;