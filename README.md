# Living Globe

![Screenshot](screenshot.png)

Data visualization application that allows the simultaneous representation of multiple spatial indicators on a 3D globe. The mapping of data to the provided visual structures is configurable by the user, introducing an aspect of customization which encourages a more immediate, visual-only interpretation of the data. The user can also filter out extremely high or extremely low samples, normalizing the remaining data and improving its visibility.

__Demo: [http://edduarte.com/living-globe/](http://edduarte.com/living-globe/)__
<br/>

## References

### Living Globe: Tridimensional Interactive Visualization of World Demographic Data

E. Duarte, P. Bordonhos, P. Dias, B. S. Santos, [*Living Globe: Tridimensional Interactive Visualization of World Demographic Data*](https://link.springer.com/chapter/10.1007%2F978-3-319-40349-6_2)

```
@Inbook{Duarte2016,
    author="Duarte, Eduardo and Bordonhos, Pedro and Dias, Paulo and Santos, Beatriz Sousa",
    editor="Yamamoto, Sakae",
    title="Living Globe: Tridimensional Interactive Visualization of World Demographic Data",
    bookTitle="Human Interface and the Management of Information:Information, Design and Interaction: 18th International Conference, HCI International 2016 Toronto, Canada, July 17-22, 2016, Proceedings, Part I",
    year="2016",
    publisher="Springer International Publishing",
    address="Cham",
    pages="14--24",
    isbn="978-3-319-40349-6",
    doi="10.1007/978-3-319-40349-6_2",
    url="http://dx.doi.org/10.1007/978-3-319-40349-6_2"
}
```

## Description

Living Globe allows the visual exploration of the following demographics data: population, population density and growth, birth and death rates, life expectancy, migration flow, crude mortality and crude birth rates. It is targeted to users having at least a minimum of computer and statistics literacy. While offering unexperienced users a default mapping of these data variables into visual variables, Living Globe allows more advanced users to select the mapping they intent to use. This means that these users have the possibility of control over an earlier stage of the visualization reference model (Riccardo Mazza. Introduction to information visualization. Springer-Verlag London, 1, 2009) making Living Globe a more flexible tool.

In order to support this feature, three visual variables may be selected to map a data type: i) height of vertical bars (directly proportional to the data value) ii) color of vertical bars (in a color scale ranging from blue to yellow) and iii) color of the countries on the globe (in a scale ranging from red to green). An adequate selection of the data variables and their mapping to the visual variables may help the identification and study of potential relations among data variables. The time interval may be selected using a slider.

Living Globe also offers the following functionality: i) textual search, with dynamic suggestion of the countries names; ii) country selection; and iii) configuration of minimum and maximum data values; This last feature, which filters out countries that do not match the minimum and maximum values and normalizes the remaining data set, can potentially lead to improvements in the interpretation of data in countries with small samples (eg. Portugal) by filtering out countries with large samples (e.g. China).

## Evaluation

The usability of this tool was tested by agnostic individuals, and the results
indicate that the data filtering and customizable mapping features encourage a
faster interpretation of relational information. Moreover, this tool improves
on previous state-of-the-art work by implementing interaction capabilities like
selection, search and filtering.

## Future Work

- remove dependencies on demographic data, making Living Globe a generic API that allows the input of any kind of data.


## License

    Copyright 2016 University of Aveiro

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
