package com.neu.web

import com.neu.api.Api
import com.neu.core.{ BootedCore, Core, CoreActors }

object Rest extends App with BootedCore with Core with CoreActors with Api with StaticResources
